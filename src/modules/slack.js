/* eslint-disable max-len */
import dotenv from 'dotenv';
import { WebClient } from '@slack/client';
import * as request from './request';
import logger from './logger';
import { stringToArr, generateId, objectAssign } from './utils';
import * as modal from './modals';

dotenv.config();
const slack = new WebClient(process.env.XOXB);

const channels = {
  78123854950: 'C8JCHPXAN',
  78126123520: 'GCPSTLV0T',
  78124169120: 'CDH9N4QNL',
};

/**
 * Отправить сообщение в канал slack
 * @param  {object} objectArg - Объект аргументов
 * https://api.slack.com/methods/chat.postMessage
 */
export function slackSendMessage(objectArg) {
  slack.chat
    .postMessage(objectArg)
    .then((res) => {
      logger.info(`SLACK:: Отправлено сообщение в ${objectArg.channel}`, res.message.text);
    })
    .catch((error) => {
      logger.error(error);
    });
}
/**
 * Обновить сообщение по временной метке (ts)
 * @param  {object} objectArg - Объект аргументов
 * https://api.slack.com/methods/chat.update
 */
export async function slackUpdateMessage(objectArg) {
  const result = await slack.chat.update(objectArg);
  logger.info('SLACK: updateMessage:: Обновлено сообщение:', result.ts);
}

/**
 * @param  {string} phoneFrom
 * Номер телефона звонящего
 * @param  {string} phoneTo
 * Номер телефона куда звонят
 */
export async function sendCallerNotify(phoneFrom, phoneTo) {
  const isBlacklisted = await request.checkPhoneBlacklist(phoneFrom);

  if (isBlacklisted) {
    const incallAttBlacklist = modal.formIncallAttBlacklist(phoneFrom, phoneTo);
    slackSendMessage({
      channel: channels[phoneTo],
      text: incallAttBlacklist.text,
      blocks: incallAttBlacklist.blocks,
      icon_emoji: ':no_mobile_phones:',
      username: 'BlackBot',
    });
  } else {
    const client = await request.getNameCaller(phoneFrom);
    let template;
    if (client) {
      if (client.is_company) {
        template = modal.templateIncallMessage('company', phoneFrom, phoneTo, null, client);
      } else if (client.company) {
        const company = await request.getClientById(client.company);
        template = modal.templateIncallMessage('company_worker', phoneFrom, phoneTo, client, company);
      } else {
        template = modal.templateIncallMessage('worker', phoneFrom, phoneTo, client);
      }
    } else {
      const worker = await request.getWorkerByPhone(phoneFrom);
      if (worker) {
        template = modal.templateIncallMessage('worker', phoneFrom, phoneTo, worker);
      } else {
        template = modal.templateIncallMessage(null, phoneFrom, phoneTo);
      }
    }

    slackSendMessage({
      channel: channels[phoneTo],
      text: template.text,
      blocks: template.blocks,
      icon_emoji: ':telephone_receiver:',
    });
  }
}

/**
 * @param  {string} trigger - Slack trigger id
 * @param  {object} template - Шаблон открываемого окна
 */
async function slackOpenModal(trigger, template) {
  try {
    const result = await slack.views.open({
      trigger_id: trigger,
      view: template,
    });
    logger.info(`SLACK:: Открыто модальное окно: ${result.view.id}`);
    logger.trace('SLACK:: Результат открытия модального окна', result);
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Реализация команды 'searchclient'.
 * @param  {string} triggerId
 */
function commandSearchclient(triggerId) {
  const template = objectAssign(modal.searchClient, { external_id: generateId('modal_searchclient_') });
  slackOpenModal(triggerId, template);
}

async function modalUpdate(viewUp, viewId) {
  try {
    const result = await slack.views.update({
      view: viewUp,
      view_id: viewId,
    });
    logger.info(`SLACK:: Модальное окно изменено: ${result.view.id}`);
    logger.trace('SLACK:: Результат открытия модального окна', result);
  } catch (error) {
    logger.error(error, error.data.response_metadata.messages);
  }
}

export async function slackHandleActions(payload) {
  switch (payload.type) {
    case 'interactive_message':
      break;

    case 'view_submission': {
      const id = payload.view.external_id.split('_')[1];

      switch (id) {
        case 'blacklist': {
          const metadata = stringToArr(payload.view.private_metadata);
          const channel = channels[metadata[1]];
          const reason = await request.phoneAddToBlacklist(
            metadata[0],
            metadata[1],
            payload.view.state.values.blacklist_comment.comment.value,
            payload.user.username,
          );
          const objectArg = modal.blacklistMessageUpdate(
            payload.user.id,
            metadata[3],
            channel,
            reason.comment,
            metadata[0],
            metadata[1],
          );
          slackUpdateMessage(objectArg);
          break;
        }
        case 'searchclient': {
          const searchStr = payload.view.state.values.searchclient_phrase.phrase.value;
          const clients = await request.searchCompany(searchStr);
          const template = modal.searchClientList(clients, searchStr);
          slackOpenModal(payload.trigger_id, template);
          break;
        }
        case 'notifychange': {
          const metadata = stringToArr(payload.view.private_metadata);
          let channel = null; let timestamp = null; let company = null; let worker = null;
          let companyVal = null; let workerVal = null;
          const message = payload.view.blocks[0].text.text;
          const status = payload.view.state.values.notify_status.status.selected_option.text.text;
          const comment = payload.view.state.values.notify_comment.comment.value;
          const author = payload.user.id;
          [channel, timestamp, companyVal, workerVal] = metadata;
          logger.trace(channel, timestamp, companyVal, workerVal);

          if (companyVal) {
            [company] = companyVal.split('_');
          }
          if (workerVal) {
            [worker] = workerVal.split('_');
          }
          logger.trace(payload.view.state.values);


          // КАК НАМ ПОНЯТЬ ЧТО КАКОЕ ТО ЗНАЧЕНИЕ ИЗМЕНИЛОСЬ????
          const temp1 = payload.view.state.values.notify_company ? payload.view.state.values.notify_company.company.selected_option : undefined;
          const temp2 = payload.view.state.values.notify_worker ? payload.view.state.values.notify_worker.worker.selected_option : undefined;
          logger.trace(temp1, temp2);
          if (temp1) {
            // const companyName = payload.view.state.values.notify_company.company.selected_option.text.text;
            const companyValue = payload.view.state.values.notify_company.company.selected_option.value;
            company = companyValue;
          } else if (companyVal) {
            [company] = companyVal.split('_'); // TODO: FIX
          } else {
            company = 'undefined';
          }
          if (temp2) {
            // const workerName = payload.view.state.values.notify_worker.worker.selected_option.text.text;
            const workerValue = payload.view.state.values.notify_worker.worker.selected_option.value;
            worker = workerValue;
          } else if (workerVal) {
            [worker] = workerVal.split('_'); // TODO: FIX
          } else {
            worker = 'undefined';
          }

          logger.trace(worker, company);

          const value = `${company}_${worker}`;
          logger.trace(value);
          const objectArg = modal.notifyAddStatus(
            channel,
            timestamp,
            message,
            status,
            comment,
            author,
            value,
          );
          slackUpdateMessage(objectArg);
          break;
        }
        default:
          logger.warn(`HANDLE-ACTION: view_submission:: Поступили данные неизвестного типа: ${id}`, payload);
          break;
      }
      break;
    }
    case 'block_actions':
      switch (payload.actions[0].action_id) {
        case 'blacklist_add': {
          const msg = modal.blacklistSelect(payload);
          slackUpdateMessage(msg);
          break;
        }
        case 'blacklist_reasons':
          console.log(payload.actions[0].selected_option);
          if (
            payload.actions[0].selected_option.text.text === 'Другая причина'
          ) {
            const template = objectAssign(modal.addPhoneBlacklist, { external_id: generateId('modal_blacklist_'), private_metadata: `${payload.actions[0].selected_option.value},${payload.message.ts}` });
            slackOpenModal(payload.trigger_id, template);
          } else {
            const phones = stringToArr(payload.actions[0].selected_option.value);
            const reason = await request.phoneAddToBlacklist(
              phones[0],
              phones[1],
              payload.actions[0].selected_option.text.text,
              payload.user.username,
            );
            const objectArg = modal.blacklistMessageUpdate(
              payload.user.id,
              payload.message.ts,
              payload.channel.id,
              reason.comment,
              phones[0],
              phones[1],
            );
            slackUpdateMessage(objectArg);
          }
          break;
        case 'status_change': {
          const notifyMsg = payload.message.blocks[0].text.text;
          const companyVal = payload.actions[0].value;
          let company = companyVal;
          let worker;
          let metadata;
          if (company === 'undefined') {
            metadata = `${payload.channel.id},${payload.message.ts},${company}`;
          } else {
            const temp = companyVal.split('_');
            company = await request.getClientById(temp[0]);
            metadata = `${payload.channel.id},${payload.message.ts},${company.id}`;
            if (temp[1]) {
              worker = await request.getClientById(temp[1]);
              metadata = `${payload.channel.id},${payload.message.ts},${company.id},${worker.id}`;
            }
          }
          const temp = objectAssign(modal.notifyUpdateStatus(notifyMsg, null, company, worker), { external_id: generateId('modal_notifychange_'), private_metadata: metadata });
          slackOpenModal(payload.trigger_id, temp);
          break;
        }
        case 'status_edit': {
          const notifyMsg = payload.message.blocks[0].text.text;
          const notifyCurrentInfo = payload.message.blocks[1].elements;
          const notifyValue = payload.actions[0].value;
          let company; let worker; let metadata = `${payload.channel.id},${payload.message.ts}`;
          [company, worker] = notifyValue.split('_');
          if (company && company !== 'undefined') {
            company = await request.getClientById(company);
            metadata = `${payload.channel.id},${payload.message.ts},${company.id}`;
          }
          if (worker && worker !== 'undefined') {
            worker = await request.getClientById(worker);
            metadata = `${payload.channel.id},${payload.message.ts},${company.id},${worker.id}`;
          }
          const temp = objectAssign(modal.notifyUpdateStatus(notifyMsg, notifyCurrentInfo, company, worker), { external_id: generateId('modal_notifychange_'), private_metadata: metadata });
          slackOpenModal(payload.trigger_id, temp);
          break;
        }
        case 'status_company': {
          const viewUpdated = modal.changeCompany(payload.view);
          modalUpdate(viewUpdated, payload.view.id);
          break;
        }
        case 'status_worker': {
          const viewUpdated = modal.changeWorker(payload.view);
          modalUpdate(viewUpdated, payload.view.id);
          break;
        }
        default:
          logger.warn('HANDLE-ACTION: block_actions:: Поступили данные неизвестного типа', payload);
          break;
      }
      break;
    case 'message_action':
      switch (payload.callback_id) {
        case 'searchclient':
          commandSearchclient(payload.trigger_id);
          break;
        default:
          logger.warn('HANDLE-ACTION: message_action:: Поступили данные неизвестного типа', payload);
          break;
      }
      break;
    case 'view_closed':
      logger.debug('HANDLE-ACTIONS:: Необъявленная форма была закрыта');

      break;
    default:
      logger.warn('HANDLE-ACTIONS:: Поступили данные неизвестного типа:', payload);
      break;
  }
}

export function slackHandleEvents(payload) {
  console.length(payload);
}

export function slackHandleCommands(payload) {
  switch (payload.command) {
    case '/searchclient': {
      commandSearchclient(payload.trigger_id);
      break;
    }
    default:
      logger.warn('HANDLE-COMMANDS:: Поступили данные неизвестного типа:', payload);
      break;
  }
}

export async function handleExternalData(res, payload) {
  const searchStr = payload.value;
  switch (payload.block_id) {
    case 'notify_company': {
      const companies = await request.searchCompany(searchStr);
      const template = modal.generateEDCompanies(companies);
      res.json(template);
      break;
    }
    case 'notify_worker': {
      const workers = await request.searchWorker(searchStr);
      const template = modal.generateEDWorkers(workers);
      res.json(template);
      break;
    }
    default:
      break;
  }
}
