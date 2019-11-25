/**
 * Формирует вложение сообщения при входящем звонке
 * @param  {string} phoneFrom - Номер звонящего
 * @param  {string} phoneTo - Номер на который звонят
 * @param  {object} client - Объект клиента из базы данных
 */
function formIncallAtt(phoneFrom, phoneTo, client) {
  let message;
  if (client) {
    if (client.is_company) {
      message = `Коллеги, входящий звонок на 612-35-20!\nПредположительно: *<http://192.168.78.7:4203/#/clients/${client.id}|${client.first_name}>*\nЗвонят с номера: ${phoneFrom}`;
    } else {
      message = `Коллеги, входящий звонок на 612-35-20!\nПредположительно: *${client.first_name} ${client.last_name} ${client.middle_name}*\nЗвонят с номера: ${phoneFrom}`;
    }
  } else {
    message = `Коллеги, входящий звонок на 612-35-20! Звонят с номера: ${phoneFrom}`;
  }
  const template = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'Привязать',
            },
            style: 'primary',
            value: 'click_me_123',
          },
          {
            type: 'button',
            action_id: 'blacklist_add',
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'Добавить в ЧС',
            },
            style: 'danger',
            value: `${phoneFrom},${phoneTo}`,
          },
        ],
      },
    ],
  };

  return template;
}

/**
 * Формирует вложение при входящем звонке, если номер находится в черном списке
 * @param  {string} phoneFrom - Номер звонящего
 * @param  {string} phoneTo - Номер на который звонят (Не используется)
 */
function formIncallAttBlacklist(phoneFrom) {
  const message = `Коллеги, входящий звонок на 612-35-20!\n*Номер находится в черном списке!*\nЗвонят с номера: ${phoneFrom}`;

  const template = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ],
  };

  return template;
}

export { formIncallAtt, formIncallAttBlacklist };
