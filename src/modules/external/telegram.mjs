import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const arr = [199420385, 1720104670];

bot.command('/start', (ctx) => {
  if (!arr.includes(ctx.chat.id)) {
    ctx.replyWithMarkdown(`Добрый день! Сообщите данный код: *${ctx.chat.id}* сотруднику компании, чтобы получить доступ к уведомлениям.`);
  }
});

export function init() {
  bot.launch();
}

export default function sendNotifyToTelegram(message) {
  arr.forEach((chatId) => {
    bot.telegram.sendMessage(chatId, message);
  });
}
/*
bot.command('/send', () => {
  sendNotifyToTelegram('Решено: GKM-INT-ZBX-SRV: Сайт intranet.go.gkm.ru недоступен');
});
*/
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
