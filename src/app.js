import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import logger from './modules/logger';
import { slackHandleActions, slackHandleEvents } from './modules/slack';

dotenv.config({ path: './.env' });

const app = express();
const server = app.listen(process.env.PORT, () => {
  logger.info('SYSTEM:: Сервер запущен на порту:', process.env.PORT);
});
let connections = [];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

server.on('connection', (connection) => {
  connections.push(connection);
  connection.on(
    'close',
    // eslint-disable-next-line no-return-assign
    () => (connections = connections.filter((curr) => curr !== connection)),
  );
});

function shutDown() {
  logger.debug('SYSTEM:: Поступил сигнал завершения процесса');
  server.close(() => {
    logger.debug('SYSTEM:: Закрытие соединений');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error(
      'SYSTEM:: Не удалось вовремя закрыть все соединения, завершаю принудительно',
    );
    process.exit(1);
  }, 10000);

  connections.forEach((curr) => curr.end());
  setTimeout(() => connections.forEach((curr) => curr.destroy()), 5000);
}

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

// Routes
app.post('/slack/actions', async (req, res) => {
  let payload = req.body;

  if (payload.challenge) {
    res.setHeader('content-type', 'application/json');
    res.status(200).json({ challenge: payload.challenge });
  } else if (payload.payload && typeof payload.payload === 'string') {
    payload = JSON.parse(payload.payload);
    logger.debug(`POST /slack/actions: Поступили данные типа: ${payload.type}`);
    logger.trace(`POST /slack/actions: ${payload}`);
    slackHandleActions(res, payload);
  }
});

app.post('/slack/events', async (req, res) => {
  let payload = req.body;

  if (payload.challenge) {
    res.setHeader('content-type', 'application/json');
    res.status(200).json({ challenge: payload.challenge });
  } else if (payload.event && payload.event.type === 'app_mention') {
    payload = JSON.parse(payload.payload);
    logger.debug(`POST /slack/events: Поступили данные типа: ${payload.type}`);
    logger.trace(`POST /slack/events: ${payload}`);
    slackHandleEvents(res, payload);
    res.status(200).end();
  }
});
