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
  78126123520: 'CDH9N4QNL',
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
    const callerName = await request.getNameCaller(phoneFrom);
    const incallAtt = modal.formIncallAtt(phoneFrom, phoneTo, callerName);
    slackSendMessage({
      channel: channels[phoneTo],
      text: incallAtt.text,
      blocks: incallAtt.blocks,
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
          const value = payload.view.state.values.searchclient_phrase.phrase;
          const clients = await request.searchClients(value);
          const template = modal.searchClientList(clients, value);
          slackOpenModal(payload.trigger_id, template);
          break;
        }
        default:
          logger.warn(`HANDLE-ACTION: view_submission:: Поступили данные неизвестного типа: ${id}`, payload);
          break;
      }
      break;
    }
    case 'block_actions':
      /*
        Обрабатываем по payload.actions[0].actions_id
        Зарезервированые значения:
        - blacklist_add (Кнопка "Добавить в ЧС")
        - blacklsit_reasons (Выбранная причина в селекте)
      */
      switch (payload.actions[0].action_id) {
        case 'blacklist_add': {
          // Мы должны обновить сообщение
          // (заменить кнопку "Добавить в ЧС" на селект с разными причинами)
          // updateMessage(payload);
          const msg = modal.blacklistSelect(payload);
          slackUpdateMessage(msg);
          break;
        }
        case 'blacklist_reasons':
          // Нужна проверка на выбранное значение,
          // если причина "другая" открываем модальное окно, иначе формируем данные и отправляем
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
        default:
          logger.warn('HANDLE-ACTION: block_actions:: Поступили данные неизвестного типа', payload);
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
      const template = objectAssign(modal.searchClient, { external_id: generateId('modal_searchclient_') });
      slackOpenModal(payload.trigger_id, template);
      break;
    }
    default:
      logger.warn('HANDLE-COMMANDS:: Поступили данные неизвестного типа:', payload);
      break;
  }
}
