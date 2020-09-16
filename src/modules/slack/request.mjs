import dotenv from 'dotenv';
import request from 'axios';
import fs from 'fs';
import logger from '../logger/main.mjs';

dotenv.config();
const url = 'http://192.168.79.31';

const storageToken = {
  'access-token': null,
  client: null,
  uid: null,
};

/**
 * Вычисление длительности выполнения запроса в милисекундах
 */
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

/**
 * Запрос: Получить токен аутентификации
 */
const getAuthToken = async () => {
  try {
    const options = {
      method: 'POST',
      url: `${url}/auth/sign_in`,
      data: {
        username: 'bot',
        password: '11034597Lm5Lin5868',
      },
    };
    const response = await request(options);
    logger.debug(`REQUEST: getAuthToken:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: validateAuthToken::', response.headers);

    return { data: response.data.data, headers: response.headers };
  } catch (error) {
    logger.error(`REQUEST: getAuthToken:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return error.response;
  }
};

/**
 * Запрос: Проверить на валидность токен аутентификации
 */
const validateAuthToken = async () => {
  try {
    const options = {
      url: `${url}/auth/validate_token`,
      data: {
        client: storageToken.client,
        uid: storageToken.uid,
        'access-token': storageToken['access-token'],
      },
    };
    const response = await request(options);
    logger.debug(`REQUEST: validateAuthToken:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: validateAuthToken::', response.headers);

    return { data: response.data.data, headers: response.headers };
  } catch (error) {
    logger.error(`REQUEST: getAuthToken:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return error.response;
  }
};

/**
 * Функция проверки валидации токена, если токен не валиден - запрос нового
 */
async function checkAuthToken() {
  if (storageToken['access-token'] && storageToken.client && storageToken.uid) {
    const status = await validateAuthToken();

    if (!status.data.success && status.data.success !== undefined) {
      logger.error(`REQUEST: checkAuthToken:: Статус: ${status.data.errors[0]}`);
    } else {
      storageToken['access-token'] = status.headers['access-token'];
      storageToken.client = status.headers.client;
      storageToken.uid = status.headers.uid;
      logger.debug('REQUEST: checkAuthToken:: Статус: Token valid.');
    }
  } else {
    const token = await getAuthToken();

    if (!token.data.success && token.data.success !== undefined) {
      logger.error(`REQUEST: checkAuthToken:: Статус: ${token.data.errors[0]}`);
    } else {
      storageToken['access-token'] = token.headers['access-token'];
      storageToken.client = token.headers.client;
      storageToken.uid = token.headers.uid;
      logger.debug('REQUEST: checkAuthToken:: Статус: Token received.');
    }
  }
}

/**
 * Запрос: Получить имя клиента по телефону
 * @param  {string} phone
 */
export const getNameCaller = async (phone) => {
  try {
    await checkAuthToken();
    const options = {
      url: `${url}/api/clients`,
      data: {
        searchtel: phone,
      },
      headers: storageToken,
    };
    const response = await request(options);
    logger.debug(`REQUEST: getNameCaller:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: getNameCaller::', response.headers);

    return response.data;
  } catch (error) {
    logger.error(`REQUEST: getAuthToken:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return null;
  }
};

/**
 * Запрос: Получить ID сотрудника по username
 * @param  {string} workerName
 */
export const getWorkerId = async (workerName) => {
  try {
    await checkAuthToken();
    const options = {
      url: `${url}/api/telephony_blacklists`,
      data: {
        workerid: workerName,
      },
      headers: storageToken,
    };
    const response = await request(options);
    logger.debug(`REQUEST: getWorkerId:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: getNameCaller::', response.headers);

    return response.data;
  } catch (error) {
    logger.error(`REQUEST: getWorkerId:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return null;
  }
};

/**
 * Запрос: Проверить находится ли номер в черном листе
 * @param  {string} phoneNumber Номер телефона
 * @returns {boolean} Вернет true или false
 */
export const checkPhoneBlacklist = async (phoneNumber) => {
  try {
    await checkAuthToken();
    const options = {
      url: `${url}/api/telephony_blacklists`,
      data: {
        num_is_ban: phoneNumber,
      },
      headers: storageToken,
    };
    const response = await request(options);

    logger.debug(`REQUEST: checkPhoneBlacklist:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: checkPhoneBlacklist::', response.headers);
    return response.data;
  } catch (error) {
    logger.error(`REQUEST: checkPhoneBlacklist:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return null;
  }
};

/**
 * Запрос: Добавить номер в черный список
 * @param  {string} phoneFrom - Номер который добавляем в ЧС (с которого звонят)
 * @param  {string} phoneTo - Номер на который звонят
 * @param  {string} comment - Комментарий из-за чего добавляем в ЧС
 * @param  {string} worker - Кто добавляет
 */
export const phoneAddToBlacklist = async (phoneFrom, phoneTo, comment, worker) => {
  try {
    const userId = await getWorkerId(worker);
    await checkAuthToken();
    const options = {
      method: 'POST',
      url: `${url}/api/telephony_blacklists`,
      data: {
        tel_from: parseInt(phoneFrom, 10),
        tel_to: parseInt(phoneTo, 10),
        comment,
        worker_id: userId,
        expire: 30,
      },
      headers: storageToken,
    };
    const response = await request(options);
    logger.debug(`REQUEST: phoneAddToBlacklist:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: phoneAddToBlacklist::', response.headers);

    return response.data;
  } catch (error) {
    logger.error(`REQUEST: phoneAddToBlacklist:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return null;
  }
};

/**
 * Запрос: Поиск компании(й) по заданной строке
 * @param  {string} str
 */
export const searchCompany = async (str) => {
  try {
    await checkAuthToken();
    const options = {
      url: `${url}/api/clients`,
      data: {
        searchcomp: str,
      },
      headers: storageToken,
    };
    const response = await request(options);
    logger.debug(`REQUEST: searchCompany:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: searchCompany::', response.headers);

    return response.data;
  } catch (error) {
    logger.error(`REQUEST: searchCompany:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return null;
  }
};

/**
 * Запрос: Поиск сотрудника(ов) по компании
 * @param  {string} str
 */
export const searchWorkerByCompanyID = async (companyId) => {
  try {
    await checkAuthToken();
    const options = {
      url: `${url}/api/clients`,
      data: {
        relation: 'peoplesofcompany',
        idcompany: companyId,
      },
      headers: storageToken,
    };
    const response = await request(options);
    logger.debug(`REQUEST: searchWorkerByCompanyID:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: searchWorkerByCompanyID::', response.headers);

    return response.data;
  } catch (error) {
    logger.error(`REQUEST: searchWorkerByCompanyID:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return null;
  }
};

export const getClientById = async (id) => {
  try {
    await checkAuthToken();
    const options = {
      url: `${url}/api/clients/${id}`,
      headers: storageToken,
    };
    const response = await request(options);
    logger.debug(`REQUEST: getClientById:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: getClientById::', response.headers);

    return response.data;
  } catch (error) {
    logger.error(`REQUEST: getClientById:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return null;
  }
};

export const getWorkerByPhone = async (phone) => {
  try {
    await checkAuthToken();
    const options = {
      url: `${url}/api/workers`,
      data: {
        searchtel: phone,
      },
      headers: storageToken,
    };
    const response = await request(options);
    logger.debug(`REQUEST: getWorkerByPhone:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: getWorkerByPhone::', response.headers);

    return response.data;
  } catch (error) {
    logger.error(`REQUEST: getWorkerByPhone:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return null;
  }
};

/**
 * Отправка: Создание обращения
 * @param  {string} subject - Комментарий обращения (Тема)
 * @param  {string} worker - Автор обращения (тот кто создает)
 * @param  {integer} status - 0 - закрыто, 1 - новое, 2 - в работе, 3 - ожидание
 * @param  {integer} source_value - Номер звонившего
 * @param  {integer} client_id - ID Компании
 * @param  {integer} employee - ID Сотрудника
 */
export const appealCreate = async (
  subject, worker, status, sourceValue, clientId, employee, timestamp,
) => {
  try {
    const workerId = await getWorkerId(worker);
    await checkAuthToken();
    const options = {
      method: 'POST',
      url: `${url}/api/trouble_tickets/`,
      data: {
        worker_id: workerId,
        client_id: clientId,
        employee,
        status: parseInt(status, 10),
        source: 2,
        source_value: sourceValue,
        subject,
        created_at: timestamp,
      },
      headers: storageToken,
    };

    if (clientId) {
      options.employee = clientId;
    }

    const response = await request(options);
    logger.debug(`REQUEST: appealCreate:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: appealCreate::', response.headers);

    return response.data;
  } catch (error) {
    logger.error(`REQUEST: appealCreate:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return null;
  }
};

export const getClientAvatarById = async (id) => {
  try {
    await checkAuthToken();
    const options = {
      url: `${url}/api/clients/${id}/avatar`,
      responseType: 'arraybuffer',
      reponseEncoding: 'binary',
    };
    const response = await request(options);
    const path = `./upload/company/${id}.jpg`;

    logger.debug(`REQUEST: getClientAvatarById:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: getClientAvatarById::', response.headers);

    fs.writeFileSync(path, response.body, 'binary');

    return path;
  } catch (error) {
    logger.error(`REQUEST: getClientAvatarById:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return null;
  }
};

export const sendCommentToAppeal = async (comment, worker, appealId) => {
  try {
    const workerId = await getWorkerId(worker);
    await checkAuthToken();
    const options = {
      method: 'POST',
      url: `${url}/api/trouble_ticket_comments/`,
      data: {
        comment,
        worker_id: workerId,
        trouble_ticket_id: appealId,
        from_slack: true,
      },
      headers: storageToken,
    };
    const response = await request(options);
    logger.debug(`REQUEST: sendCommentToAppeal:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: sendCommentToAppeal::', response.headers);

    return response.data;
  } catch (error) {
    logger.error(`REQUEST: sendCommentToAppeal:: Статус: ${error.response.status}. Описание: ${error.response.statusText}. Запрос выполнился за: ${error.duration / 1000} s`);
    return null;
  }
};
