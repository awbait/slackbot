import dotenv from 'dotenv';
import { formatPhoneNumber, objectAssign } from './utils';

dotenv.config();
const frontUrl = process.env.FRONT_URL;

/**
 * @param  {string} type - Тип уведомления
 * @param  {string} phoneFrom - Номер звонящего
 * @param  {string} phoneTo - Номер на который поступил вызов
 * @param  {object} client - Сотрудник
 * @param  {object} company - Компания
 */
export function templateIncallMessage(type, phoneFrom, phoneTo, worker, company) {
  const phoneFromFormatted = formatPhoneNumber(phoneFrom, true);
  const phoneToFormatted = formatPhoneNumber(phoneTo);

  let message;
  let messagePretext;
  let statusValue = 'undefined';

  const companyObject = {
    type: 'mrkdwn',
  };
  const workerObject = {
    type: 'mrkdwn',
  };
  const undefinedObject = {
    type: 'mrkdwn',
  };

  switch (type) {
    case 'company':
      messagePretext = `Входящий звонок на ${phoneToFormatted}! Компания: ${company.first_name}`;
      message = `Коллеги, входящий звонок на ${phoneToFormatted}!\nЗвонок с номера: ${phoneFromFormatted}`;

      companyObject.text = `:office: *Компания:* <${frontUrl}/#/clients/${company.id}|${company.first_name}>`;

      statusValue = `${company.id}`;
      break;
    case 'company_worker':
      messagePretext = `Входящий звонок на ${phoneToFormatted}! Компания: ${company.first_name} Сотрудник: ${worker.last_name} ${worker.first_name} ${worker.middle_name}`;
      message = `Коллеги, входящий звонок на ${phoneToFormatted}!\nЗвонок с номера: ${phoneFromFormatted}`;

      companyObject.text = `:office: *Компания:* <${frontUrl}/#/clients/${company.id}|${company.first_name}>`;
      workerObject.text = `:pig: *Сотрудник:* <${frontUrl}/#/clients/${worker.id}|${worker.last_name} ${worker.first_name} ${worker.middle_name}>`;

      statusValue = `${company.id}_${worker.id}`;
      break;
    case 'worker':
      messagePretext = `Входящий звонок на ${phoneToFormatted}! Сотрудник: ${worker.last_name} ${worker.first_name} ${worker.middle_name}`;
      message = `Коллеги, входящий звонок на ${phoneToFormatted}!\nПредположительно: *<${frontUrl}/#/workers/${worker.id}|${worker.last_name} ${worker.first_name}>*\nЗвонок с номера: ${phoneFromFormatted}`;

      workerObject.text = `:pig: *Сотрудник:* <${frontUrl}/#/workers/${worker.id}|${worker.last_name} ${worker.first_name} ${worker.middle_name}>`;
      break;
    default:
      messagePretext = `Входящий звонок на ${phoneToFormatted}! Звонок с номера: ${phoneFrom}`;
      message = `Коллеги, входящий звонок на ${phoneToFormatted}!\nЗвонок с номера: ${phoneFromFormatted}`;

      undefinedObject.text = ':question: Номер неизвестен';
      break;
  }

  const template = {
    text: messagePretext,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
      {
        type: 'context',
        elements: [],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            action_id: 'status_change',
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'Комментарий',
            },
            style: 'primary',
            value: statusValue,
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

  switch (type) {
    case 'company':
      template.blocks[1].elements.push(companyObject);
      break;
    case 'company_worker':
      template.blocks[1].elements.push(companyObject);
      template.blocks[1].elements.push(workerObject);
      break;
    case 'worker':
      template.blocks[1].elements.push(workerObject);
      break;
    default:
      template.blocks[1].elements.push(undefinedObject);
      break;
  }

  return template;
}

/**
 * Формирует сообщение при входящем звонке, если номер находится в черном списке
 * @param  {string} phoneFrom - Номер звонящего
 * @param  {string} phoneTo - Номер на который поступил звонок
 */
export function formIncallAttBlacklist(phoneFrom, phoneTo) {
  const phoneFromFormatted = formatPhoneNumber(phoneFrom, true);
  const phoneToFormatted = formatPhoneNumber(phoneTo);
  const message = `Коллеги, входящий звонок на ${phoneToFormatted}!\n*Номер находится в черном списке!*\nЗвонят с номера: ${phoneFromFormatted}`;

  const template = {
    text: message,
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
 * Формирование модального окна с найденными клиентами
 * @param  {array} clients - Массив найденных компаний
 * @param  {string} value - Значение по которому находили компанию
 */
export function searchClientList(clients, value) {
  const clientCount = clients.length;
  const template = {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: `Найдено результатов: ${clientCount}`,
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: 'Закрыть',
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
      const phone = client.phones.length !== 0 ? `${formatPhoneNumber(client.phones.find((phoneVal) => phoneVal.is_main === true).tel_number, true)}` : 'Нет данных';
      const email = client.emails.length !== 0 ? client.emails.find((emailVal) => emailVal.is_main === true).address : 'Нет данных';
      const site = client.website ? client.website : 'Нет данных';
      const address = client.addresses ? client.addresses[0] : 'Нет данных';
      let clientName = client.first_name;
      if (!client.is_company) {
        clientName = `${client.first_name} ${client.last_name} ${client.middle_name}`;
      }
      const section = {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${frontUrl}/#/clients/${client.id}|${clientName}>*\n:telephone_receiver: *Телефон:* ${phone}\n:email: *Почта:* ${email}\n:computer: *Сайт:* ${site}\n:office: *Адрес:* ${address}`,
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

export function blacklistSelect(message) {
  const msg = message;
  const { value } = msg.actions[0];

  const messageBlock = {
    type: 'actions',
    elements: [
      {
        type: 'static_select',
        action_id: 'blacklist_reasons',
        placeholder: {
          type: 'plain_text',
          text: 'Выберите причину',
          emoji: true,
        },
        confirm: {
          title: {
            type: 'plain_text',
            text: 'Подтверждение',
          },
          text: {
            type: 'mrkdwn',
            text: 'Вы подтверждаете добавление номера в черный список?',
          },
          confirm: {
            type: 'plain_text',
            text: 'Добавить',
          },
          deny: {
            type: 'plain_text',
            text: 'Отменить',
          },
        },
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Спам',
              emoji: true,
            },
            value: `${value},${1}`,
          },
          {
            text: {
              type: 'plain_text',
              text: 'Реклама',
              emoji: true,
            },
            value: `${value},${2}`,
          },
          {
            text: {
              type: 'plain_text',
              text: 'Другая причина',
              emoji: true,
            },
            value: `${value},${3}`,
          },
        ],
      },
    ],
  };

  msg.message.blocks[2] = messageBlock;
  const objectArg = {
    channel: msg.channel.id,
    ts: msg.message.ts,
    blocks: msg.message.blocks,
  };
  return objectArg;
}

export function blacklistLoaderMessageUpdate(message, channel) {
  const msg = message;

  const divider = {
    type: 'divider',
  };
  const loader = {
    type: 'context',
    elements: [
      {
        type: 'image',
        image_url: 'https://i.imgur.com/WRQcGqB.png',
        alt_text: 'loader',
      },
      {
        type: 'mrkdwn',
        text: '*Добавление номера в черный список*',
      },
    ],
  };

  msg.blocks[2] = divider;
  msg.blocks.push(loader);

  const objectArg = {
    channel,
    ts: message.ts,
    blocks: msg.blocks,
  };
  return objectArg;
}

/**
 * Формирует измененное сообщение при добавлении номера в ЧС
 * @param  {string} userId - slack user id
 * @param  {string} timestamp - Точка времени сообщения
 * @param  {string} channel - Канал где изменяем сообщение
 * @param  {string} reason - Причина добавления в ЧС
 * @param  {string} phoneTo - Номер на который был произведен вызов
 * @param  {string} phoneFrom - Номер с которого звонили
 */
export function blacklistMessageUpdate(userId, message, channel, reason) {
  const msg = message;
  const result = {
    type: 'context',
    elements: [
      {
        type: 'image',
        image_url: 'https://i.imgur.com/RPQcuiT.png',
        alt_text: 'OK',
      },
      {
        type: 'mrkdwn',
        text: `<@${userId}> *добавил номер в черный список: ${reason}*`,
      },
    ],
  };

  msg.blocks[3] = result;

  const objectArg = {
    channel,
    ts: msg.ts,
    blocks: msg.blocks,
  };
  return objectArg;
}

export function notifyUpdateStatus(message, currentMsgInfo, company, worker) {
  const statuses = {
    ':hammer_and_pick: В работе': 'value-1',
    ':question: Недостаточно информации': 'value-2',
    ':heavy_check_mark: Решена': 'value-3',
    ':recycle: Обрабатывается': 'value-4',
    ':lock: Закрыта': 'value-5',
  };
  let initialStatus = '';
  let initialComment = '';

  let initialCompanyObject;
  let initialWorkerObject;
  if (company !== 'undefined') {
    if (company) {
      initialCompanyObject = {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Компания:* ${company.first_name}`,
        },
        accessory: {
          type: 'button',
          action_id: 'status_company',
          text: {
            type: 'plain_text',
            emoji: true,
            text: 'Не правильно?',
          },
          value: `${company.id}`,
        },
      };
    }
  } else {
    initialCompanyObject = {
      type: 'input',
      block_id: 'notify_company',
      optional: true,
      label: {
        type: 'plain_text',
        text: 'Компания',
        emoji: true,
      },
      element: {
        type: 'external_select',
        action_id: 'company',
        placeholder: {
          type: 'plain_text',
          text: 'Поиск компании',
          emoji: true,
        },
        min_query_length: 3,
      },
    };
  }
  if (worker && worker !== 'undefined') {
    initialWorkerObject = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Сотрудник:* ${worker.last_name} ${worker.first_name} ${worker.middle_name}`,
      },
      accessory: {
        type: 'button',
        action_id: 'status_worker',
        text: {
          type: 'plain_text',
          emoji: true,
          text: 'Не правильно?',
        },
        value: `${worker.id}`,
      },
    };
  } else {
    initialWorkerObject = {
      type: 'input',
      block_id: 'notify_worker',
      optional: true,
      label: {
        type: 'plain_text',
        text: 'Сотрудник',
        emoji: true,
      },
      element: {
        type: 'external_select',
        action_id: 'worker',
        placeholder: {
          type: 'plain_text',
          text: 'Поиск сотрудника',
          emoji: true,
        },
        min_query_length: 3,
      },
    };
  }
  let initialStatusObject;
  if (currentMsgInfo) {
    initialStatus = currentMsgInfo[0].text.replace(':information_source: *Статус:* ', '');
    if (currentMsgInfo.length >= 3) {
      initialComment = currentMsgInfo[1].text.replace(':memo: *Комментарий:* ', '');
    }
    initialStatusObject = {
      initial_option: {
        text: {
          type: 'plain_text',
          text: initialStatus,
          emoji: true,
        },
        value: statuses[initialStatus],
      },
    };
  }
  const template = {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: 'Добавить комментарий',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'Добавить',
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
          text: message,
        },
      },
      {
        type: 'input',
        block_id: 'notify_status',
        label: {
          type: 'plain_text',
          text: 'Статус',
          emoji: true,
        },
        element: {
          type: 'static_select',
          action_id: 'status',
          placeholder: {
            type: 'plain_text',
            text: 'Выберите статус',
            emoji: true,
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: ':hammer_and_pick: В работе',
                emoji: true,
              },
              value: 'value-1',
            },
            {
              text: {
                type: 'plain_text',
                text: ':question: Недостаточно информации',
                emoji: true,
              },
              value: 'value-2',
            },
            {
              text: {
                type: 'plain_text',
                text: ':heavy_check_mark: Решена',
                emoji: true,
              },
              value: 'value-3',
            },
            {
              text: {
                type: 'plain_text',
                text: ':recycle: Обрабатывается',
                emoji: true,
              },
              value: 'value-4',
            },
            {
              text: {
                type: 'plain_text',
                text: ':lock: Закрыта',
                emoji: true,
              },
              value: 'value-5',
            },
          ],
        },
      },
      {
        type: 'input',
        block_id: 'notify_comment',
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Комментарий',
          emoji: true,
        },
        element: {
          type: 'plain_text_input',
          action_id: 'comment',
          initial_value: `${initialComment}`,
          multiline: true,
          placeholder: {
            type: 'plain_text',
            text: 'Введите комментарий',
            emoji: true,
          },
        },
      },
    ],
  };

  if (currentMsgInfo) {
    const element = objectAssign(template.blocks[1].element, initialStatusObject);
    template.blocks[1].element = element;
  }
  template.blocks.push(initialCompanyObject);
  template.blocks.push(initialWorkerObject);
  return template;
}

// eslint-disable-next-line max-len
export function notifyAddStatus(channel, timestamp, message, status, comment, user, value, companyData, workerData) {
  const statusText = `:information_source: *Статус:* ${status}`;
  const userText = `:male-office-worker: *Изменил(а)* <@${user}>`;
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message,
      },
      accessory: {
        type: 'button',
        action_id: 'status_edit',
        text: {
          type: 'plain_text',
          text: 'Изменить статус',
          emoji: true,
        },
        value: `${value}`,
      },
    },
    {
      type: 'context',
      elements: [],
    },
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${statusText}`,
        },
        {
          type: 'mrkdwn',
          text: `${userText}`,
        },
      ],
    },
  ];

  if (comment) {
    const commentText = `:memo: *Комментарий:* ${comment}`;
    const commentObj = {
      type: 'mrkdwn',
      text: `${commentText}`,
    };
    const author = blocks[3].elements.pop();
    blocks[3].elements.push(commentObj, author);
  }

  const companyObject = {
    type: 'mrkdwn',
  };
  const workerObject = {
    type: 'mrkdwn',
  };
  const undefinedObject = {
    type: 'mrkdwn',
  };

  if (companyData && workerData) {
    companyObject.text = `:office: *Компания:* <${frontUrl}/#/clients/${companyData.id}|${companyData.first_name}>`;
    workerObject.text = `:pig: *Сотрудник:* <${frontUrl}/#/clients/${workerData.id}|${workerData.last_name} ${workerData.first_name} ${workerData.middle_name}>`;
    blocks[1].elements.push(companyObject);
    blocks[1].elements.push(workerObject);
  } else if (companyData) {
    companyObject.text = `:office: *Компания:* <${frontUrl}/#/clients/${companyData.id}|${companyData.first_name}>`;
    blocks[1].elements.push(companyObject);
  } else if (workerData) {
    workerObject.text = `:pig: *Сотрудник:* <${frontUrl}/#/clients/${workerData.id}|${workerData.last_name} ${workerData.first_name} ${workerData.middle_name}>`;
    blocks[1].elements.push(workerObject);
  } else {
    undefinedObject.text = ':question: Номер неизвестен';
    blocks[1].elements.push(undefinedObject);
  }

  const objectArg = {
    channel,
    ts: timestamp,
    blocks,
  };
  return objectArg;
}

/**
 * Сгенерировать JSON селекта клиентов
 * @param  {array} clients
 */
export function generateEDCompanies(companies) {
  const json = {
    options: [],
  };
  companies.forEach((company) => {
    const object = {
      text: {
        type: 'plain_text',
        text: company.first_name,
      },
      value: `${company.id}`,
    };

    json.options.push(object);
  });
  return json;
}

/**
 * Сгенерировать JSON селекта сотрудников
 * @param  {array} clients
 */
export function generateEDWorkers(workers) {
  const json = {
    options: [],
  };
  workers.forEach((worker) => {
    const object = {
      text: {
        type: 'plain_text',
        text: `${worker.last_name} ${worker.first_name} ${worker.middle_name}`,
      },
      value: `${worker.id}`,
    };

    json.options.push(object);
  });
  return json;
}

export function changeCompany(view) {
  const updatedView = {
    type: view.type,
    blocks: view.blocks,
    private_metadata: view.private_metadata,
    title: view.title,
    close: view.close,
    submit: view.submit,
    external_id: view.external_id,
  };
  const companyObject = {
    type: 'input',
    block_id: 'notify_company',
    optional: true,
    label: {
      type: 'plain_text',
      text: 'Компания',
      emoji: true,
    },
    element: {
      type: 'external_select',
      action_id: 'company',
      placeholder: {
        type: 'plain_text',
        text: 'Выберите компанию',
        emoji: true,
      },
      min_query_length: 2,
    },
  };
  updatedView.blocks[3] = companyObject;
  return updatedView;
}

export function changeWorker(view) {
  const updatedView = {
    type: view.type,
    blocks: view.blocks,
    private_metadata: view.private_metadata,
    title: view.title,
    close: view.close,
    submit: view.submit,
    external_id: view.external_id,
  };
  const companyObject = {
    type: 'input',
    block_id: 'notify_worker',
    optional: true,
    label: {
      type: 'plain_text',
      text: 'Сотрудник',
      emoji: true,
    },
    element: {
      type: 'external_select',
      action_id: 'worker',
      placeholder: {
        type: 'plain_text',
        text: 'Поиск сотрудника',
        emoji: true,
      },
      min_query_length: 3,
    },
  };
  updatedView.blocks[4] = companyObject;
  return updatedView;
}
