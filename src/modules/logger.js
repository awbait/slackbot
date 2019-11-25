import { configure, getLogger } from 'log4js';

configure({
  appenders: { console: { type: 'console' }, fileAppender: { type: 'file', filename: '../logs/server.log' } },
  categories: { default: { appenders: ['console', 'fileAppender'], level: 'trace' } },
});

const logger = getLogger();
export default logger;
