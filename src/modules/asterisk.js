import dotenv from 'dotenv';
import AGIServer from 'ding-dong';
import { sendCallerNotify } from './slack';
import logger from './logger';

dotenv.config();

const handler = async (context) => {
  context
    .onEvent('variables')
    .then((vars) => {
      const phones = {
        'ivr-4169120': '78126123520',
        '3854950day': '78123854950', // Исправить ivr
      };
      let callerTo = phones[vars.agi_context];
      callerTo = '78123854950'; // FIXME: Перед релизом новой версии убрать
      sendCallerNotify(vars.agi_callerid, callerTo);
      logger.trace('ASTERISK: Поступил входящий вызов::', vars);
    })
    .then(() => context.end());
};

const agi = new AGIServer(handler);
agi.start(process.env.ASTERISK_PORT);
