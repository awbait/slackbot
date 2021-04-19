import nodemailer from 'nodemailer';

import logger from '../logger/main.mjs';
import * as webSlack from '../slack/api/web.mjs';

async function sendMail(text) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
      user: 'monitoring@lhost.su',
      pass: '53662731Fms@',
    },
  });

  const info = await transporter.sendMail({
    from: '"monitoring@lhost.su" <monitoring@lhost.su>',
    to: 'paliy@lhost.su',
    subject: text,
    text,
    html: `<b>${text}</b>`,
  });

  logger.info('KORUS-MAIL-SIZE-ALERTS:: Mail message sent: %s', info.messageId);
}

// mail - ящик с которым проблема
export default async function alert(mail) {
  const text = `Почтовый ящик ${mail} переполнен.`;

  webSlack.sendMessage({
    channel: 'C8K2TAASF', // it_monitoring
    username: 'Korus',
    text,
    icon_emoji: 'email',
  });

  sendMail(text).catch(logger.error);
}
