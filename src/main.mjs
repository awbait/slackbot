import express from 'express';
import slackEvents from './modules/slack/events.mjs';
import slackInteractions from './modules/slack/api/interactive-message.mjs';
import routes from './routes.mjs';
import asterisk from './modules/asterisk/main.mjs';
import * as database from './modules/mongo/database.mjs';
import logger from './modules/logger/main.mjs';
import mailNotify from './modules/mail-alerts/index.mjs';
import * as tgBot from './modules/external/telegram.mjs';

asterisk();
mailNotify();
database.init();
tgBot.init();

const app = express();

app.use('/slack/events', slackEvents.requestListener());
app.use('/slack/actions', slackInteractions.requestListener());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(routes);

const listener = app.listen(process.env.PORT, () => {
  logger.info(`EXPRESS:: Server running on ${listener.address().port} port`);
});

process.on('SIGINT', () => {
  database.disconnect((err) => {
    process.exit(err ? 1 : 0);
  });
});
