import dotenv from 'dotenv';
import interactiveMessages from '@slack/interactive-messages';
import * as templates from '../templates.mjs';
import * as request from '../request.mjs';
import * as database from '../../mongo/database.mjs';
import { generateId, objectAssign } from '../../other/utils.mjs';
import * as slackWeb from './web.mjs';
import logger from '../../logger/main.mjs';

dotenv.config();
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;

const slackInteractions = interactiveMessages.createMessageAdapter(slackSigningSecret);
export default slackInteractions;

async function handleButtonActions(payload) {
  switch (payload.actions[0].action_id) {
    /*
      Ложный вызов
    */
    case 'call_false': {
      const falseButton = JSON.parse(payload.actions[0].value);
      const objectArg = templates.falseCallMessageUpdate(
        payload.user.id,
        payload.message,
        payload.channel.id,
        falseButton,
      );
      slackWeb.updateMessage(objectArg);
      break;
    }
    /*
      Создать обращение
    */
    case 'appeal_create': {
      const appealButton = JSON.parse(payload.actions[0].value);
      appealButton.channel_id = payload.channel.id;
      appealButton.message_ts = payload.message.ts;
      appealButton.message = payload.message.blocks[0].text.text;

      let company; let worker;
      if (appealButton.company_id) {
        company = await request.getClientById(appealButton.company_id);
      }
      if (appealButton.worker_id) {
        worker = await request.getClientById(appealButton.worker_id);
      }
      const appealTemplate = objectAssign(templates.createAppeal(appealButton, company, worker), { external_id: generateId('modal_appealcreate_'), private_metadata: JSON.stringify(appealButton) });
      slackWeb.openModal(payload.trigger_id, appealTemplate);
      break;
    }
    /*
      Изменить компанию в модальном окне создания обращения
    */
    case 'appeal_company_change': {
      const viewUpdated = templates.modalAppealCompanyChange(payload.view);
      slackWeb.updateModal(viewUpdated, payload.view.id);
      break;
    }
    /*
      Изменить сотрудника в модальном окне создания обращения
    */
    case 'appeal_worker_change': {
      const viewUpdated = templates.modalAppealWorkerChange(payload.view);
      slackWeb.updateModal(viewUpdated, payload.view.id);
      break;
    }
    /*
      Добавить в Черный Список
    */
    case 'blacklist_add': {
      const objectArg = templates.blacklistSelectReason(payload);
      slackWeb.updateMessage(objectArg);
      break;
    }
    default:
      logger.warn('HANDLE-ACTION: block_actions:: Поступили данные неизвестного типа', payload);
      break;
  }
}

slackInteractions.action({ type: 'static_select' }, async (payload) => {
  switch (payload.actions[0].action_id) {
    /*
      Выбор причины добавления в Черный Список
    */
    case 'blacklist_reasons':
      if (payload.actions[0].selected_option.text.text === 'Другая причина') {
        const metadata = JSON.parse(payload.actions[0].selected_option.value);
        metadata.channel = payload.channel.id;
        metadata.ts = payload.message.ts;
        metadata.message = payload.blocks[0].text.text;
        const template = objectAssign(templates.blacklistOtherReason,
          {
            private_metadata: JSON.stringify(metadata),
          });
        slackWeb.openModal(payload.trigger_id, template);
      } else {
        logger.info('HFJJFJFJ', payload);
        const metadata = JSON.parse(payload.actions[0].selected_option.value);
        const objectArgLoader = templates.blacklistLoader(payload.message, payload.channel.id);
        slackWeb.updateMessage(objectArgLoader);
        const reason = await request.phoneAddToBlacklist(
          metadata.phone_from,
          metadata.phone_to,
          payload.actions[0].selected_option.text.text,
          payload.user.username,
        );
        logger.info(reason);
        const objectArg = templates.blacklistMessageUpdate(
          payload.message.blocks[0].text.text,
          payload.message.ts,
          payload.user.id,
          payload.channel.id,
          reason.comment,
        );
        logger.info(objectArg);
        slackWeb.updateMessage(objectArg);
      }
      break;

    default:
      break;
  }
});

slackInteractions.action({ type: 'message_action' }, (payload) => {
  logger.info(payload);
});

slackInteractions.action({ type: 'dialog_submission' }, (payload) => {
  logger.info(payload);
});

slackInteractions.action({ type: 'button' }, (payload) => {
  handleButtonActions(payload);
});

slackInteractions.viewSubmission('create-appeal', async (payload) => {
  const metadata = JSON.parse(payload.view.private_metadata);
  const payloadValues = payload.view.state.values;
  const author = payload.user.id;
  if (payloadValues.notify_comment) {
    metadata.subject = payload.view.state.values.notify_comment.comment.value;
  }
  if (payloadValues.notify_status) {
    metadata.status = payloadValues.notify_status.status.selected_option.value;
  }
  if (payloadValues.appeal_company && payloadValues.appeal_company.company.selected_option) {
    metadata.company_id = payloadValues.appeal_company.company.selected_option.value;
  }
  if (payloadValues.appeal_worker && payloadValues.appeal_worker.append.selected_option) {
    metadata.worker_id = payloadValues.appeal_worker.append.selected_option.value;
  }
  if (payloadValues.appeal_worker) {
    if (payloadValues.appeal_worker.append) {
      if (payloadValues.appeal_worker.append.type === 'checkboxes') {
        delete metadata.worker_id;
      }
    }
  }
  let company; let worker;
  if (metadata.company_id) {
    company = await request.getClientById(metadata.company_id);
  }
  if (metadata.worker_id) {
    worker = await request.getClientById(metadata.worker_id);
  }

  if (metadata.company_id && payloadValues.appeal_worker) {
    if (payloadValues.appeal_worker.append.selected_options) {
      delete metadata.worker_id;
      const appealSearchClient = objectAssign(templates.appealSearchClient(metadata), { external_id: generateId('modal_appealcreate_'), private_metadata: JSON.stringify(metadata) });
      slackWeb.openModal(payload.trigger_id, appealSearchClient);
      return;
    }
  }
  const authorId = payload.user.username;
  const createdAppeal = await request.appealCreate(
    metadata.subject, authorId,
    metadata.status,
    metadata.phone_from,
    metadata.company_id,
    metadata.worker_id,
    metadata.timestamp,
  );
  const appealId = createdAppeal.id;
  const objectArg = templates.updateMsgWithAppeal(
    metadata,
    appealId,
    metadata.subject,
    author,
    company,
    worker,
  );
  database.createAppeal(appealId, metadata.message_ts);
  slackWeb.updateMessage(objectArg);
});

slackInteractions.viewSubmission('blacklist_other_reason', async (payload) => {
  const metadata = JSON.parse(payload.view.private_metadata);
  const reason = await request.phoneAddToBlacklist(
    metadata.phone_from,
    metadata.phone_to,
    payload.view.state.values.blacklist_comment.comment.value,
    payload.user.username,
  );
  const objectArg = templates.blacklistMessageUpdate(
    metadata.message,
    metadata.ts,
    payload.user.id,
    metadata.channel,
    reason.comment,
  );
  slackWeb.updateMessage(objectArg);
});
