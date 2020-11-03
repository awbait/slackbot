import * as request from './index.mjs';
import logger from '../../logger/main.mjs';

/**
 * Запрос: Получить токен аутентификации
 */
// eslint-disable-next-line import/prefer-default-export
export const getYandexCompanyInfo = async (text) => {
  try {
    const options = {
      method: 'GET',
      url: 'https://search-maps.yandex.ru/v1/',
      params: {
        apikey: '71bb1ff1-d5d9-4d06-9da6-12914203f9a4', // TODO: вынести в файл
        text,
        lang: 'ru_RU',
      },
    };
    const response = await request.axios(options);
    logger.debug(`REQUEST: getCompanyInfo:: Статус: ${response.status}. Запрос выполнился за: ${response.duration / 1000} s`);
    logger.trace('REQUEST-HEADERS: getCompanyInfo::', response.headers);

    return response.data;
  } catch (error) {
    request.errorHandler(error);
    return false;
  }
};
