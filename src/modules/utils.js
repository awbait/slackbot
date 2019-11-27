/**
 * Разбить строку в массив
 * @param  {string} string
 */
export function stringToArr(string) {
  const arr = string.split(/[\s,]+/);
  return arr;
}
/**
 * Генерация случайной строки
 * @param  {string} string - Добавит указанную строку перед сгенерированным id
 */
export function generateId(string) {
  const random = `f${(+new Date()).toString(16)}`;
  return string ? string + random : random;
}
/**
 * Объединить два объекта
 * @param  {object} sourceObj
 * @param  {object} mutableObj
 */
export function objectAssign(sourceObj, mutableObj) {
  const result = Object.assign(sourceObj, mutableObj);
  return result;
}
/**
 * Форматирует номера телефонов
 * @param  {string} number - Номер телефона
 * @param  {boolean} code - Необязательная переменная, true - если нужно добавить код телефона
 */
export function formatPhoneNumber(number, code) {
  let phone = (`${number}`).replace(/\D/g, '');
  const match = phone.match(/^(7|)?(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    if (!code) {
      phone = [match[3], '-', match[4], '-', match[5]].join('');
    } else {
      const intlCode = (match[1] ? '+7 ' : '');
      phone = [intlCode, '(', match[2], ') ', match[3], '-', match[4], '-', match[5]].join('');
    }
    return phone;
  }
  return null;
}
