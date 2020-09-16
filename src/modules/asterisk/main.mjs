import dotenv from 'dotenv';
import AGIServer from 'ding-dong';
import { sendCallerNotify } from '../slack/main.mjs';
import logger from '../logger/main.mjs';

dotenv.config();

export default function initialize() {
  const handler = async (context) => {
    context
      .onEvent('variables')
      .then((vars) => {
        const phones = {
          'ivr-4169120': '78124169120',
          'ivr-3854950': '78123854950',
          'ivr-6123520': '78126123520',
        };
        const callerTo = phones[vars.agi_context];
        sendCallerNotify(vars.agi_callerid, callerTo);
        logger.trace('ASTERISK: Поступил входящий вызов::', vars);
      })
      .then(() => context.end());
  };

  const agi = new AGIServer(handler);
  agi.start(process.env.ASTERISK_PORT);
}
