import request from 'request-promise';
import logger from './logger';

let headers;

async function getAuthToken() {
  const options = {
    method: 'POST',
    uri: 'http://192.168.79.31/auth/sign_in',
    body: {
      username: 'bot',
      password: '11034597Lm5Lin5868',
    },
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };
  const response = await request(options);
  logger.debug(`REQUEST: getAuthToken:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000}s`);
  logger.trace('REQUEST-HEADERS: getAuthToken::', response.headers);
  return response.headers;
}

async function checkAuthToken(header) {
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

async function validateAuthToken() {
  const options = {
    method: 'GET',
    uri: 'http://192.168.79.31/auth/validate_token',
    headers,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };
  const res = await request(options);
  logger.debug('Запрос выполнился за:', res.elapsedTime);
  // console.log(res);
  return res.headers;
}

async function getNameCaller(phone) {
  const options = {
    uri: 'http://192.168.79.31/api/clients',
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
  logger.debug(`REQUEST: getNameCaller:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} ms`);
  logger.trace('REQUEST-HEADERS: getNameCaller::', response.headers);
  checkAuthToken(response.headers);
  return response.body;
}

async function getWorkerId(workerName) {
  const options = {
    uri: 'http://192.168.79.31/api/telephony_blacklists',
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
async function checkPhoneBlacklist(phoneNumber) {
  const options = {
    uri: 'http://192.168.79.31/api/telephony_blacklists',
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

async function phoneAddToBlacklist(phones, comment, worker) {
  const userId = await getWorkerId(worker);
  const phone = phones.split(/[\s,]+/);

  const options = {
    method: 'POST',
    uri: 'http://192.168.79.31/api/telephony_blacklists',
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

  logger.debug(`REQUEST: phoneAddToBlacklist:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} ms`);
  logger.trace('REQUEST-HEADERS: phoneAddToBlacklist::', response.headers);
  checkAuthToken(response.headers);
  return response.body;
}

export {
  getAuthToken, getNameCaller, getWorkerId, checkPhoneBlacklist, phoneAddToBlacklist,
};
