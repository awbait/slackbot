import { configure, getLogger } from 'log4js';

configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'trace' } },
});

const logger = getLogger();
export default logger;
