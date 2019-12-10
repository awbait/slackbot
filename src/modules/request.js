import dotenv from 'dotenv';
import request from 'request-promise';
import logger from './logger';

dotenv.config();
const url = process.env.REQUEST_URL;
const storageToken = {
  'access-token': null,
  client: null,
  uid: null,
};

/**
 * Запрос: Получить токен аутентификации
 */
async function getAuthToken() {
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
  return { body: response.body, headers: response.headers };
}

/**
 * Запрос: Проверить на валидность токен аутентификации
 */
async function validateAuthToken() {
  const options = {
    uri: `${url}/auth/validate_token`,
    body: {
      client: storageToken.client,
      uid: storageToken.uid,
      'access-token': storageToken['access-token'],
    },
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };
  const response = await request(options);
  logger.debug(`REQUEST: validateAuthToken:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: validateAuthToken::', response.headers);
  return { headers: response.headers, body: response.body };
}

/**
 * Функция проверки валидации токена, если токен не валиден - запрос нового
 */
async function checkAuthToken() {
  if (storageToken['access-token'] && storageToken.client && storageToken.uid) {
    const status = await validateAuthToken();
    if (status.body.success) {
      storageToken['access-token'] = status.headers['access-token'];
      storageToken.client = status.headers.client;
      storageToken.uid = status.headers.uid;
    }
  } else {
    const token = await getAuthToken();
    if (!token.body.success) {
      storageToken['access-token'] = token.headers['access-token'];
      storageToken.client = token.headers.client;
      storageToken.uid = token.headers.uid;
    } else {
      logger.error(`REQUEST: checkAuthToken:: ${token.body.errors[0]}`);
    }
  }
}

/**
 * Запрос: Получить имя клиента по телефону
 * @param  {string} phone
 */
export async function getNameCaller(phone) {
  await checkAuthToken();
  const options = {
    uri: `${url}/api/clients`,
    qs: {
      searchtel: phone,
    },
    headers: storageToken,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };
  const response = await request(options);
  storageToken['access-token'] = response.headers['access-token'];
  logger.debug(`REQUEST: getNameCaller:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: getNameCaller::', response.headers);
  return response.body;
}

/**
 * Запрос: Получить ID сотрудника по username
 * @param  {string} workerName
 */
export async function getWorkerId(workerName) {
  await checkAuthToken();
  const options = {
    uri: `${url}/api/telephony_blacklists`,
    qs: {
      workerid: workerName,
    },
    headers: storageToken,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };

  const response = await request(options);
  storageToken['access-token'] = response.headers['access-token'];
  logger.debug(`REQUEST: getWorkerId:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: getWorkerId::', response.headers);
  return response.body;
}

/**
 * Запрос: Проверить находится ли номер в черном листе
 * @param  {string} phoneNumber Номер телефона
 * @returns {boolean} Вернет true или false
 */
export async function checkPhoneBlacklist(phoneNumber) {
  await checkAuthToken();
  const options = {
    uri: `${url}/api/telephony_blacklists`,
    qs: {
      num_is_ban: phoneNumber,
    },
    headers: storageToken,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };

  const response = await request(options);
  storageToken['access-token'] = response.headers['access-token'];
  logger.debug(`REQUEST: checkPhoneBlacklist:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: checkPhoneBlacklist::', response.headers);
  return response.body;
}

/**
 * Запрос: Добавить номер в черный список
 * @param  {string} phoneFrom - Номер который добавляем в ЧС (с которого звонят)
 * @param  {string} phoneTo - Номер на который звонят
 * @param  {string} comment - Комментарий из-за чего добавляем в ЧС
 * @param  {string} worker - Кто добавляет
 */
export async function phoneAddToBlacklist(phoneFrom, phoneTo, comment, worker) {
  const userId = await getWorkerId(worker);
  await checkAuthToken();
  const options = {
    method: 'POST',
    uri: `${url}/api/telephony_blacklists`,
    body: {
      tel_from: parseInt(phoneFrom, 10),
      tel_to: parseInt(phoneTo, 10),
      comment,
      worker_id: userId,
      expire: 30,
    },
    headers: storageToken,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };
  const response = await request(options);
  logger.debug(`REQUEST: phoneAddToBlacklist:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: phoneAddToBlacklist::', response.headers);

  return response.body;
}

/**
 * Запрос Поиск клиента(ов) по строке
 * @param  {string} str
 */
export async function searchClients(str) {
  await checkAuthToken();
  const options = {
    uri: `${url}/api/clients`,
    qs: {
      search: str,
    },
    headers: storageToken,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };
  const response = await request(options);
  storageToken['access-token'] = response.headers['access-token'];
  logger.debug(`REQUEST: searchClients:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: searchClients::', response.headers);
  return response.body;
}

export async function getClientById(id) {
  await checkAuthToken();
  const options = {
    uri: `${url}/api/clients/${id}`,
    headers: storageToken,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };
  const response = await request(options);
  storageToken['access-token'] = response.headers['access-token'];
  logger.debug(`REQUEST: getClientById:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: getClientById::', response.headers);
  return response.body;
}

export async function getWorkerByPhone(phone) {
  await checkAuthToken();
  const options = {
    uri: `${url}/api/workers`,
    qs: {
      searchtel: phone,
    },
    headers: storageToken,
    resolveWithFullResponse: true,
    json: true,
    time: true,
  };
  const response = await request(options);
  storageToken['access-token'] = response.headers['access-token'];
  logger.debug(`REQUEST: getWorkerByPhone:: Статус: ${response.statusCode}. Запрос выполнился за: ${response.elapsedTime / 1000} s`);
  logger.trace('REQUEST-HEADERS: getWorkerByPhone::', response.headers);
  return response.body;
}
