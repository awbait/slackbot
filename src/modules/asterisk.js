import dotenv from 'dotenv';
import AGIServer from 'ding-dong';
import { sendCallerNotify } from './slack';

dotenv.config();

const handler = async (context) => {
  context
    .onEvent('variables')
    .then((vars) => {
      // TODO: Переработать проверку формирования номера телефона на который поступает звонок
      // В дальшейшем может использоваться для определения канала отправки сообщений
      let callerTo;
      if (vars.agi_context === 'ivr-4169120') {
        callerTo = '78126123520';
      }
      sendCallerNotify(vars.agi_callerid, callerTo);
    })
    .then(() => context.end());
};

export default function asteriskInit() {
  const agi = new AGIServer(handler);
  agi.start(process.env.ASTERISK_PORT);
}
