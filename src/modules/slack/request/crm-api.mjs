import * as request from './index.mjs';
import logger from '../../logger/main.mjs';

const url = process.env.REQUEST_URL;

const storageToken = {
  'access-token': null,
  client: null,
  uid: null,
};

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
    const response = await request.axios(options);
    logger.debug(`REQUEST: getAuthToken:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: validateAuthToken::', response.headers);

    return { data: response.data.data, headers: response.headers };
  } catch (error) {
    request.errorHandler(error);
    return false;
  }
};
