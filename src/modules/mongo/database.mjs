import mongoose from 'mongoose';
import Appeal from './models/appeal.mjs';
import logger from '../logger/main.mjs';

export function init() {
  mongoose.connect('mongodb://slackbot:11034597Lm@127.0.0.1:27017/slackbot', { useNewUrlParser: true, useUnifiedTopology: true }, ((error) => {
    if (error) logger.error(error);
  }));

  const db = mongoose.connection;

  db.once('open', () => {
    logger.info('DATABASE:: Connected');
  });

  db.on('error', (error) => {
    logger.error('error', error);
  });
}

export function createAppeal(appealId, messageTs) {
  const appeal = new Appeal({
    appeal_id: appealId,
    message_ts: messageTs,
  });
  appeal.save().then((result) => {
    logger.trace(`DATABASE: createAppeal:: ${result}`);
  });
}

export async function findAppealById(appealId) {
  const appeal = await Appeal.findOne({ appeal_id: appealId })
    .exec();
  return appeal;
}

export async function findAppealByMsgTs(messageTs) {
  const appeal = await Appeal.findOne({ message_ts: messageTs })
    .exec();
  return appeal;
}
