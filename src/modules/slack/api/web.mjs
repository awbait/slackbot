import dotenv from 'dotenv';
import slack from '@slack/web-api';
import logger from '../../logger/main.mjs';

dotenv.config();
const token = process.env.XOXB;

const web = new slack.WebClient(token);

export async function getUserInfo(user) {
  const response = await web.users.info({ user });
  return response;
}

export async function sendMessage(object) {
  const response = await web.chat.postMessage(object);
  logger.info(`SLACK:: Отправлено сообщение в ${object.channel}`, response.message.text);
  return response;
}

export async function updateMessage(object) {
  try {
    const result = await web.chat.update(object);
    logger.info('SLACK: updateMessage:: Обновлено сообщение: ', result.ts);
  } catch (error) {
    logger.error(error, error.data);
  }
}

export async function openModal(trigger, template) {
  try {
    const result = await web.views.open({
      trigger_id: trigger,
      view: template,
    });
    logger.info(`SLACK:: Открыто модальное окно: ${result.view.id}`);
    logger.trace('SLACK:: Результат открытия модального окна', result);
  } catch (error) {
    logger.error(error, error.data);
  }
}

export async function updateModal(template, viewId) {
  try {
    const result = await web.views.update({
      view: template,
      view_id: viewId,
    });
    logger.info('SLACK: updateMessage:: Обновлено сообщение: ', result.ts);
  } catch (error) {
    logger.error(error, error.data);
  }
}
