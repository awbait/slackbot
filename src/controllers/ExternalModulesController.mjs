import logger from '../modules/logger/main.mjs';
import alert from '../modules/external/korus-mail-size-alerts.mjs';

export function korusMailSizeChecker(req, res) {
  logger.trace('EXTERNAL-CONTROLLER: ', req.body);
  if (req.body.mail) {
    alert(req.body.mail);
  }
  res.status(200).end();
}

export function korusMailSizeChecker2(req, res) {
  logger.trace('EXTERNAL-CONTROLLER: ', req, res);
}
