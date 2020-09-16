import dotenv from 'dotenv';
import events from '@slack/events-api';
import { getUserInfo } from './api/web.mjs';
import { sendCommentToAppeal } from './request.mjs';
import * as database from '../mongo/database.mjs';

dotenv.config();
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;

const slackEvents = events.createEventAdapter(slackSigningSecret);

export default slackEvents;

async function messageEventHandler(event) {
  if (event.bot_id) return;
  if (event.thread_ts) {
    // Предполагаем что это ответ на обращение
    // Ищем по thread_ts обращение в базе
    const appealId = await database.findAppealByMsgTs(event.thread_ts);
    if (appealId) {
      const comment = event.text;
      const worker = await getUserInfo(event.user);
      sendCommentToAppeal(comment, worker.user.name, appealId.appeal_id);
    }
  }
}

slackEvents.on('message', (event) => {
  messageEventHandler(event);
});
