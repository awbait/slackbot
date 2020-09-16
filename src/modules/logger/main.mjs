import log4js from 'log4js';

log4js.configure({
  appenders: { console: { type: 'console' }, fileAppender: { type: 'file', filename: './logs/server.log' } },
  categories: { default: { appenders: ['console', 'fileAppender'], level: 'trace' } },
});

const logger = log4js.getLogger();
export default logger;
