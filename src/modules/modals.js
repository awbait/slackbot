import dotenv from 'dotenv';

dotenv.config();
const front_url = process.env.FRONT_URL;
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
      message = `Коллеги, входящий звонок на 385-49-50!\nПредположительно: *<http://192.168.78.7:4203/#/clients/${client.id}|${client.first_name}>*\nЗвонят с номера: ${phoneFrom}`;
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
      element: {
        type: 'plain_text_input',
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

export function searchClientList(clients, value) {
  // кол-во записей
  // значение по которому мы находили клиентов
  // массив объектов выбранных клиентов  
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

  for (let client in clients) {
    client = clients[client];
    console.log(client)
    const divider = {
      type: 'divider',
    }
    const phone = client.phones.length !== 0 ? client.phones.find(phone => phone.is_main === true).tel_number : '';
    const email = client.emails.length !== 0 ? client.emails.find(email => email.is_main === true).address : '';
    const section = {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${front_url}/#/clients/${client.id}|${client.first_name}>*\n:telephone_receiver: Телефон: *+${phone}*\n:email: Почта: *${email}*\n:computer: Сайт: *${client.website}*`,
        },
    }
    
    template.blocks.push(divider);
    template.blocks.push(section);
  }
  
  return template;
}
