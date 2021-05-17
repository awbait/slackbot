import notifier from 'mail-notifier';
import * as webSlack from '../slack/api/web.mjs';
import * as tgBot from '../external/telegram.mjs';

const imap = {
  user: 'zbx.notification@gmail.com',
  password: 'sYfdUPjh3KP3',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

function sendSlackAlertFromMail(mail) {
  let emoji = ':angry:';
  if (mail.subject.startsWith('Решено')) {
    emoji = ':grinning:';
  }

  webSlack.sendMessage({
    channel: 'GM672BXNZ', // sla_monitoring
    username: 'Megapolis',
    text: mail.subject,
    icon_emoji: emoji,
  });

  // if mail thread содержит слово "Сайт"
  if (mail.subject.includes('Сайт')) {
    tgBot.sendNotifyToTelegram(mail.subject);
  }
}

export default function init() {
  const n = notifier(imap);
  n.on('end', () => n.start())
    .on('mail', (mail) => {
      sendSlackAlertFromMail(mail);
    })
    .start();
}
