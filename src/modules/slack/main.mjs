import dotenv from 'dotenv';
import logger from '../logger/main.mjs';
import * as request from './request.mjs';
import { getYandexCompanyInfo } from './request/yandex-api.mjs';
import * as templates from './templates.mjs';
import * as database from '../mongo/database.mjs';
import * as webSlack from './api/web.mjs';

dotenv.config();

const channels = {
  78123854950: 'C8JCHPXAN',
  78126123520: 'GCPSTLV0T',
  78124169120: 'CDH9N4QNL',
};
const channelsType = {
  78123854950: 'calls',
  78126123520: 'support',
  78124169120: 'test',
};

/**
 * Отправить новый комментарий обращения в thread, если таковая есть в базе.
 * @param  {string} comment - Комментарий
 */
export async function addCommentToAppealMsg(data) {
  const appeal = await database.findAppealById(data.ticket_id);
  logger.info(appeal);
  logger.info(data.type_id);
  switch (parseInt(data.type_id, 10)) {
    case 1:
      // Отправлено через CRM
      if (appeal) {
        // Обращение в слаке найдено, отправляем сообщение в тред
        webSlack.sendMessage({
          thread_ts: appeal.message_ts,
          reply_broadcast: true,
          channel: 'GCPSTLV0T',
          text: data.text,
        });
      } else {
        const template = await templates.sendAppealFromCRM(data);

        const response = await webSlack.sendMessage({
          channel: 'GCPSTLV0T',
          text: template.text,
          blocks: template.blocks,
        });

        if (response) {
          webSlack.sendMessage({
            thread_ts: response.ts,
            reply_broadcast: true,
            channel: 'GCPSTLV0T',
            text: data.text,
          });
        }
        // Создать новое обращение в Slack через CRM
      }
      break;

    case 2:
      // Отправлено через почту
      if (appeal) {
        // Обращение в слаке найдено, отправляем сообщение в тред
        logger.trace('Обращение в слаке найдено, отправляем сообщение в тред');
        webSlack.sendMessage({
          thread_ts: appeal.message_ts,
          reply_broadcast: true,
          channel: 'GCPSTLV0T',
          text: data.text,
        });
      } else {
        // Создать новое обращение в Slack через Почту
        logger.trace('Создать новое обращение в Slack через Почту');
        const template = await templates.sendAppealFromEmail(data);

        const response = await webSlack.sendMessage({
          channel: 'GCPSTLV0T',
          text: template.text,
          blocks: template.blocks,
        });

        if (response) {
          webSlack.sendMessage({
            thread_ts: response.ts,
            reply_broadcast: true,
            channel: 'GCPSTLV0T',
            text: data.text,
          });
        }
      }

      break;
    default:
      logger.trace('default CASE');
      break;
  }
}

export async function handleExternalData(res, payload) {
  const searchStr = payload.value;
  switch (payload.block_id) {
    case 'appeal_company': {
      const companies = await request.searchCompany(searchStr);
      const template = templates.generateEDCompanies(companies);
      res.json(template);
      break;
    }
    case 'appeal_worker': {
      const metadata = JSON.parse(payload.view.private_metadata);
      const workers = await request.searchWorkerByCompanyID(metadata.company_id, searchStr);
      const template = templates.generateEDWorkers(workers);
      res.json(template);
      break;
    }
    default:
      break;
  }
}

export async function sendCallerNotify(phoneFrom, phoneTo) {
  const isBlacklisted = await request.checkPhoneBlacklist(phoneFrom);

  if (isBlacklisted) {
    // TODO: НОМЕР В ЧС
  } else {
    let template;
    let avatar = 'https://i.imgur.com/OTQR7sr.png';
    const channelType = channelsType[phoneTo];

    // Запрашиваем информацию о номере из CRM
    const client = await request.getNameCaller(phoneFrom);

    if (client) {
      if (client.is_company) {
        template = templates.incallMessage('company', channelType, phoneFrom, phoneTo, null, client);
        avatar = `http://81.29.128.59:30005/crm/company/${client.id}/avatar`;
      } else if (client.company) {
        const company = await request.getClientById(client.company);
        avatar = `http://81.29.128.59:30005/crm/company/${company.id}/avatar`;
        template = templates.incallMessage('company_worker', channelType, phoneFrom, phoneTo, client, company);
      } else {
        template = templates.incallMessage('worker', channelType, phoneFrom, phoneTo, client);
      }
    } else {
      const worker = await request.getWorkerByPhone(phoneFrom);
      if (worker) {
        template = templates.incallMessage('worker', channelType, phoneFrom, phoneTo, client);
      } else {
        // Запрашиваем информацию о номере у Яндекса
        const phoneInfo = await getYandexCompanyInfo(phoneFrom);
        if (phoneInfo.features.length > 0) {
          template = templates.incallMessage('yandex', channelType, phoneFrom, phoneTo, phoneInfo);
        } else {
          template = templates.incallMessage(null, channelType, phoneFrom, phoneTo);
        }
      }
    }
    webSlack.sendMessage({
      channel: channels[phoneTo],
      text: template.text,
      blocks: template.blocks,
      icon_url: avatar,
    });
  }
}

/**
 * Реализация команды 'searchclient'.
 * @param  {string} triggerId
 */
/*
function commandSearchclient(triggerId) {
  const template = objectAssign(modal.searchClient, {
    external_id: generateId('modal_searchclient_')
  });
  slackOpenModal(triggerId, template);
}
*/
