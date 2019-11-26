import dotenv from 'dotenv';

dotenv.config();
const frontUrl = process.env.FRONT_URL;
/**
 * Формирует вложение сообщения при входящем звонке
 * @param  {string} phoneFrom - Номер звонящего
 * @param  {string} phoneTo - Номер на который звонят
 * @param  {object} client - Объект клиента из базы данных
 */
export function formIncallAtt(phoneFrom, phoneTo, client) {
  let message;
  if (client) {
    if (client.is_company) {
      message = `Коллеги, входящий звонок на 385-49-50!\nПредположительно: *<${frontUrl}/#/clients/${client.id}|${client.first_name}>*\nЗвонят с номера: ${phoneFrom}`;
    } else {
      message = `Коллеги, входящий звонок на 385-49-50!\nПредположительно: *${client.first_name} ${client.last_name} ${client.middle_name}*\nЗвонят с номера: ${phoneFrom}`;
    }
  } else {
    message = `Коллеги, входящий звонок на 385-49-50! Звонят с номера: ${phoneFrom}`;
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
export function formIncallAttBlacklist(phoneFrom) {
  const message = `Коллеги, входящий звонок на 385-49-50!\n*Номер находится в черном списке!*\nЗвонят с номера: ${phoneFrom}`;

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

export const searchClient = {
  type: 'modal',
  external_id: 'modal_searchclient_',
  title: {
    type: 'plain_text',
    text: 'Поиск клиента',
    emoji: true,
  },
  submit: {
    type: 'plain_text',
    text: 'Поиск',
    emoji: true,
  },
  close: {
    type: 'plain_text',
    text: 'Отмена',
    emoji: true,
  },
  blocks: [
    {
      type: 'input',
      block_id: 'searchclient_phrase',
      element: {
        type: 'plain_text_input',
        action_id: 'phrase',
        placeholder: {
          type: 'plain_text',
          text: 'Начните вводить название',
        },
      },
      label: {
        type: 'plain_text',
        text: 'Поиск клиента',
        emoji: true,
      },
    },
  ],
};

export const addPhoneBlacklist = {
  type: 'modal',
  title: {
    type: 'plain_text',
    text: 'Добавить номер в ЧС',
    emoji: true,
  },
  submit: {
    type: 'plain_text',
    text: 'Добавить',
    emoji: true,
  },
  close: {
    type: 'plain_text',
    text: 'Отменить',
    emoji: true,
  },
  blocks: [
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: 'Введите причину, по которой добавляете номер в черный список.',
        emoji: true,
      },
    },
    {
      type: 'input',
      block_id: 'blacklist_comment',
      element: {
        type: 'plain_text_input',
        action_id: 'comment',
        multiline: true,
        placeholder: {
          type: 'plain_text',
          text: 'Введите что-нибудь',
        },
      },
      label: {
        type: 'plain_text',
        text: 'Причина',
      },
    },
  ],
};
/**
 * @param  {array} clients - Массив найденных компаний
 * @param  {string} value - Значение по которому находили компанию
 */
export function searchClientList(clients, value) {
  const clientCount = clients.length;
  const template = {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: `Найдено ${clientCount} клиента`,
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'Вперед',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: 'Отмена',
      emoji: true,
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:mag: Найденные результаты по: *${value}*`,
        },
      },
    ],
  };
  const divider = {
    type: 'divider',
  };
  if (clientCount !== 0) {
    clients.forEach((client) => {
      const phone = client.phones.length !== 0 ? client.phones.find((phoneVal) => phoneVal.is_main === true).tel_number : 'Нет данных';
      const email = client.emails.length !== 0 ? client.emails.find((emailVal) => emailVal.is_main === true).address : 'Нет данных';
      // TODO: Проверка is_company для полного отображения имени компании/человека
      const section = {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${this.frontUrl}/#/clients/${client.id}|${client.first_name}>*\n:telephone_receiver: Телефон: *+${phone}*\n:email: Почта: *${email}*\n:computer: Сайт: *${client.website}*`,
        },
      };

      template.blocks.push(divider);
      template.blocks.push(section);
    });
  } else {
    const section = {
      type: 'section',
      text: {
        type: 'plain_text',
        text: ':no_entry: Клиент не найден',
        emoji: true,
      },
    };
    template.blocks.push(divider);
    template.blocks.push(section);
  }

  return template;
}
