import dotenv from 'dotenv';
import request from 'request-promise';
import logger from './logger';

dotenv.config();
const url = process.env.REQUEST_URL;
let headers;

export async function getAuthToken() {
  const options = {
    method: 'POST',
    uri: `${url}/auth/sign_in`,
    body: {
      username: 'bot',
      password: '11034597Lm5Lin5868',
    },
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };
  const response = await request(options);
  logger.debug(`REQUEST: getAuthToken:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: getAuthToken::', response.headers);
  return response.headers;
}

export async function checkAuthToken(header) {
  // Если ErrorStatusCode 401
  if (header === null || header === undefined) {
    const response = await getAuthToken();
    headers = {
      'Content-Type': 'application/json',
      'access-token': response['access-token'],
      client: response.client,
      uid: response.uid,
    };
  }
  logger.trace('REQUEST-HEADERS: checkAuthToken::', headers);
}
checkAuthToken();

export async function getNameCaller(phone) {
  const options = {
    uri: `${url}/api/clients`,
    qs: {
      searchtel: phone,
    },
    headers,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };
  checkAuthToken();
  const response = await request(options);
  logger.debug(`REQUEST: getNameCaller:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: getNameCaller::', response.headers);
  checkAuthToken(response.headers);
  return response.body;
}

export async function getWorkerId(workerName) {
  const options = {
    uri: `${url}/api/telephony_blacklists`,
    qs: {
      workerid: workerName,
    },
    headers,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };

  let response = await request(options);

  if (response.StatusCodeError === 401) {
    logger.debug(`REQUEST: getWorkerId:: Статус: ${response.StatusCodeError}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
    logger.trace('REQUEST-HEADERS: getWorkerId::', response.headers);
    checkAuthToken();
    response = await request(options);
  }
  logger.debug(`REQUEST: getWorkerId:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: getWorkerId::', response.headers);
  checkAuthToken(response.headers);
  return response.body;
}

/**
 * Проверить находится ли номер в черном листе
 * @param  {string} phoneNumber Номер телефона
 * @returns {boolean} Вернет true или false
 */
export async function checkPhoneBlacklist(phoneNumber) {
  const options = {
    uri: `${url}/api/telephony_blacklists`,
    qs: {
      num_is_ban: phoneNumber,
    },
    headers,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };

  const response = await request(options);
  logger.debug(`REQUEST: checkPhoneBlacklist:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: checkPhoneBlacklist::', response.headers);
  checkAuthToken(response.headers);
  return response.body;
}

export async function phoneAddToBlacklist(phones, comment, worker) {
  const userId = await getWorkerId(worker);
  const phone = phones.split(/[\s,]+/);

  const options = {
    method: 'POST',
    uri: `${url}/api/telephony_blacklists`,
    body: {
      tel_from: parseInt(phone[0], 10),
      tel_to: parseInt(phone[1], 10),
      comment,
      worker_id: userId,
      expire: 30,
    },
    headers,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };
  checkAuthToken();
  const response = await request(options);

  logger.debug(`REQUEST: phoneAddToBlacklist:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: phoneAddToBlacklist::', response.headers);
  checkAuthToken(response.headers);
  return response.body;
}

export async function searchClients(string) {
  const options = {
    uri: `${url}/api/clients`,
    qs: {
      search: string,
    },
    headers,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };
  checkAuthToken();
  const response = await request(options);

  logger.debug(`REQUEST: searchClients:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: searchClients::', response.headers);
  return response.body;
}
