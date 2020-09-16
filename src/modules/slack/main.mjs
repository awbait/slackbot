import dotenv from 'dotenv';
import * as request from './request.mjs';
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
export async function addCommentToAppealMsg(comment) {
  const ts = await database.findAppealById(comment.ticket_id);
  if (ts) {
    webSlack.sendMessage({
      thread_ts: ts.message_ts,
      reply_broadcast: true,
      channel: 'CDH9N4QNL', // TODO: Добавить его в базу?
      text: comment.text,
    });
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
        template = templates.incallMessage(null, channelType, phoneFrom, phoneTo);
      }
    }
    webSlack.sendMessage({
      channel: channels[phoneTo],
      text: template.text,
      blocks: template.blocks,
      icon_url: avatar, // FIXME:: Не работают аватары
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
