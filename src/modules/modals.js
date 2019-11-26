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

export function searchClientList() {
  // кол-во записей
  // значение по которому мы находили клиентов
  const template = {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: 'Найдено 2 клиента',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'Submit',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
      emoji: true,
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':mag: Найденные результаты по: *Тра*',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*<fakeLink.toYourApp.com|Название компании>*\nОписание или какая-либо информация',
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            emoji: true,
            text: 'Показать',
          },
          value: 'click_me_123',
        },
      },

      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*<fakeLink.toYourApp.com|Название компании>*\nОписание или какая-либо информация',
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            emoji: true,
            text: 'Показать',
          },
          value: 'click_me_123',
        },
      },

      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*<fakeLink.toYourApp.com|Название компании>*\nОписание или какая-либо информация',
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            emoji: true,
            text: 'Показать',
          },
          value: 'click_me_123',
        },
      },

      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*<fakeLink.toYourApp.com|Название компании>*\nОписание или какая-либо информация',
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            emoji: true,
            text: 'Показать',
          },
          value: 'click_me_123',
        },
      },

      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*<fakeLink.toYourApp.com|Название компании>*\nОписание или какая-либо информация',
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            emoji: true,
            text: 'Показать',
          },
          value: 'click_me_123',
        },
      },

      {
        type: 'divider',
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'Следующие 5 результатов?',
            },
            value: 'click_me_123',
          },
        ],
      },
    ],
  };
}
