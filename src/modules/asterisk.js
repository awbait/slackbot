import dotenv from 'dotenv';
import AGIServer from 'ding-dong';
import { sendCallerNotify } from './slack';
import logger from './logger';

dotenv.config();

const handler = async (context) => {
  context
    .onEvent('variables')
    .then((vars) => {
      // TODO: Переработать проверку формирования номера телефона на который поступает звонок
      // В дальшейшем может использоваться для определения канала отправки сообщений
      let callerTo;
      logger.info(vars);
      if (vars.agi_context === 'ivr-4169120') {
        callerTo = '78126123520';
      } else if (vars.agi_context === '3854950day') {
        callerTo = '78123854950';
      }
      callerTo = '78123854950';
      sendCallerNotify(vars.agi_callerid, callerTo);
    })
    .then(() => context.end());
};

const agi = new AGIServer(handler);
agi.start(process.env.ASTERISK_PORT);
