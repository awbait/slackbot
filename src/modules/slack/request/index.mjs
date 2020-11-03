import request from 'axios';
import logger from '../../logger/main.mjs';

request.interceptors.request.use((config) => {
  const cfg = config;
  cfg.metadata = { startTime: new Date() };
  return cfg;
}, (error) => Promise.reject(error));

request.interceptors.response.use((response) => {
  response.config.metadata.endTime = new Date();
  response.duration = response.config.metadata.endTime - response.config.metadata.startTime;
  return response;
}, (error) => {
  const err = error;
  err.config.metadata.endTime = new Date();
  err.duration = err.config.metadata.endTime - err.config.metadata.startTime;
  return Promise.reject(err);
});
export const axios = request;

export function errorHandler(funcName, error) {
  if (error.response) {
    logger.error(`REQUEST: ${funcName} - Статус: ${error.response.status}. Описание: ${error.response.data}. Запрос выполнился за: ${error.duration / 1000} s`);
  } else if (error.request) {
    logger.error(`REQUEST: ${funcName} - ${error.request}`);
  } else {
    logger.error(`REQUEST: ${funcName} - ${error.message}`);
  }
}

export function responseHandler(response) {
  return response;
}
