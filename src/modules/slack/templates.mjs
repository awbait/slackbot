import dotenv from 'dotenv';
import { formatPhoneNumber, objectAssign } from '../other/utils.mjs';

dotenv.config();
const frontUrl = process.env.FRONT_URL;

/**
 * Сформировать шаблон входящего сообщения
 * @param  {string} type - тип сообщения, зависит от входных данных
 * @param  {string} channelType - определяет в какой канал отправлять сообщение
 * @param  {string} phoneFrom - Номер с которого был совершен вызов
 * @param  {string} phoneTo - Номер на который был совершен вызов
 * @param  {integer} worker - Сотрудник
 * @param  {integer} company - Компания
 */
export function incallMessage(type, channelType, phoneFrom, phoneTo, worker, company) {
  const phoneFromFormatted = formatPhoneNumber(phoneFrom, true);
  const phoneToFormatted = formatPhoneNumber(phoneTo);

  let message;
  let messagePretext;

  const appealButton = {
    phone_from: phoneFrom,
    phone_to: phoneTo,
  };
  const blacklistButton = { ...appealButton };

  const appealValue = 'undefined';

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
      message = `Коллеги, входящий звонок: ${phoneFromFormatted}`;

      companyObject.text = `:office: *Компания:* <${frontUrl}/#/clients/${company.id}|${company.first_name}>`;

      appealButton.company_id = company.id;
      break;
    case 'company_worker':
      messagePretext = `Входящий звонок на ${phoneToFormatted}! Компания: ${company.first_name} Сотрудник: ${worker.last_name} ${worker.first_name} ${worker.middle_name}`;
      message = `Коллеги, входящий звонок: ${phoneFromFormatted}`;

      companyObject.text = `:office: *Компания:* <${frontUrl}/#/clients/${company.id}|${company.first_name}>`;
      workerObject.text = `:pig: *Сотрудник:* <${frontUrl}/#/clients/${worker.id}|${worker.last_name} ${worker.first_name} ${worker.middle_name}>`;

      appealButton.company_id = company.id;
      appealButton.worker_id = worker.id;
      break;
    case 'worker':
      messagePretext = `Входящий звонок на ${phoneToFormatted}! Сотрудник: ${worker.last_name} ${worker.first_name} ${worker.middle_name}`;
      message = `Коллеги, входящий звонок: ${phoneFromFormatted}! Предположительно: *<${frontUrl}/#/workers/${worker.id}|${worker.last_name} ${worker.first_name}>*`;

      workerObject.text = `:pig: *Сотрудник:* <${frontUrl}/#/workers/${worker.id}|${worker.last_name} ${worker.first_name} ${worker.middle_name}>`;
      break;
    default:
      messagePretext = `Входящий звонок на ${phoneToFormatted}! Звонок с номера: ${phoneFrom}`;
      message = `Коллеги, входящий звонок: ${phoneFromFormatted}`;

      undefinedObject.text = ':question: Номер неизвестен';
      break;
  }

  appealButton.timestamp = new Date();
  const buttonsSupport = [
    {
      type: 'button',
      action_id: 'call_false',
      text: {
        type: 'plain_text',
        emoji: true,
        text: 'Ложный вызов',
      },
      value: JSON.stringify(appealButton),
    },
    {
      type: 'button',
      action_id: 'appeal_create',
      text: {
        type: 'plain_text',
        emoji: true,
        text: 'Обращение',
      },
      style: 'primary',
      value: JSON.stringify(appealButton),
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
      value: JSON.stringify(blacklistButton),
    },
  ];

  const buttonsCalls = [
    {
      type: 'button',
      action_id: 'directory_create',
      text: {
        type: 'plain_text',
        emoji: true,
        text: 'Не трогать!',
      },
      style: 'primary',
      value: appealValue,
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
      value: JSON.stringify(blacklistButton),
    },
    {
      type: 'button',
      action_id: 'call_false',
      text: {
        type: 'plain_text',
        emoji: true,
        text: 'Ложный вызов',
      },
      value: 'false',
    },
  ];
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
        elements: [],
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

  if (channelType === 'support') {
    template.blocks[2].elements = buttonsSupport;
  } else if (channelType === 'calls') {
    template.blocks[2].elements = buttonsCalls;
  } else {
    template.blocks[2].elements = buttonsSupport;
  }

  return template;
}

/**
 * Шаблон модального окна создания Обращения
 * @param  {json} appeal
 * @param  {integer} company
 * @param  {integer} worker
 */
export function createAppeal(appeal, company, worker) {
  const initialComment = '';

  let initialCompanyObject;
  let initialWorkerObject;
  if (appeal.company_id && company) {
    initialCompanyObject = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Компания:* ${company.first_name}`,
      },
      accessory: {
        type: 'button',
        action_id: 'appeal_company_change',
        text: {
          type: 'plain_text',
          emoji: true,
          text: 'Не правильно?',
        },
        value: `${company.id}`,
      },
    };
  } else {
    initialCompanyObject = {
      type: 'input',
      block_id: 'appeal_company',
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
  if (appeal.worker_id && worker) {
    initialWorkerObject = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Сотрудник:* ${worker.last_name} ${worker.first_name} ${worker.middle_name}`,
      },
      accessory: {
        type: 'button',
        action_id: 'appeal_worker_change',
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
      block_id: 'appeal_worker',
      optional: true,
      element: {
        type: 'checkboxes',
        action_id: 'append',
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Добавить сотрудника?',
              emoji: true,
            },
            value: 'appeal_worker_append',
          },
        ],
      },
      label: {
        type: 'plain_text',
        text: 'Сотрудник',
        emoji: true,
      },
    };
  }

  const initialStatusObject = {
    initial_option: {
      text: {
        type: 'plain_text',
        text: ':new: Новое',
        emoji: true,
      },
      value: '1',
    },
  };
  const template = {
    type: 'modal',
    callback_id: 'create-appeal',
    title: {
      type: 'plain_text',
      text: 'Обращение',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'Создать',
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
          text: appeal.message,
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
                text: ':new: Новое',
                emoji: true,
              },
              value: '1',
            },
            {
              text: {
                type: 'plain_text',
                text: ':hammer_and_pick: В работе',
                emoji: true,
              },
              value: '2',
            },
            {
              text: {
                type: 'plain_text',
                text: ':zzz: Ждем',
                emoji: true,
              },
              value: '3',
            },
            {
              text: {
                type: 'plain_text',
                text: ':lock: Закрыта',
                emoji: true,
              },
              value: '0',
            },
          ],
        },
      },
      {
        type: 'input',
        block_id: 'notify_comment',
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

  const element = objectAssign(template.blocks[1].element, initialStatusObject);
  template.blocks[1].element = element;
  template.blocks.push(initialCompanyObject);
  template.blocks.push(initialWorkerObject);
  return template;
}
/**
 * Шаблон ложного вызова
 * @param  {} userId
 * @param  {} message
 * @param  {} channel
 */
export function falseCallMessageUpdate(userId, message, channel, metadata) {
  const msg = message;
  const divider = {
    type: 'divider',
  };
  const status = {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: ':information_source: Статус: Ложный вызов',
      },
      {
        type: 'mrkdwn',
        text: `:male-office-worker: Изменил(а) <@${userId}>`,
      },
    ],
  };

  if (metadata.company_id || metadata.worker_id) {
    msg.blocks[2] = divider;
    msg.blocks[3] = status;
  } else {
    msg.blocks[1] = divider;
    msg.blocks[2] = status;
  }

  const objectArg = {
    channel,
    ts: msg.ts,
    blocks: msg.blocks,
  };

  return objectArg;
}

/**
 * Шаблон сообщения с созданным обращением
 * @param  {json} metadata
 * @param  {integer} appealId
 * @param  {string} comment
 * @param  {string} user
 * @param  {json} companyData
 * @param  {json} workerData
 */
export function updateMsgWithAppeal(metadata, appealId, comment, user, companyData, workerData) {
  const statusText = `:notebook: *Обращение:* <${frontUrl}/#/support/troubles/${appealId}/comments|#${appealId}>`;
  const userText = `:male-office-worker: *Создал(а)* <@${user}>`;
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: metadata.message,
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
    channel: metadata.channel_id,
    ts: metadata.message_ts,
    blocks,
  };
  return objectArg;
}

/**
 * Вызывается при нажатии кнопки "Не правильно?" в модальном окне создания обращения
 * Добавляет чекбокс для изменения сотрудника
 * @param  {json} view - Предыдущее модальное окно
 */
export function modalAppealWorkerChange(view) {
  const updatedView = {
    type: view.type,
    blocks: view.blocks,
    private_metadata: view.private_metadata,
    title: view.title,
    close: view.close,
    submit: view.submit,
    external_id: view.external_id,
  };
  const workerObject = {
    type: 'input',
    block_id: 'appeal_worker',
    optional: true,
    element: {
      type: 'checkboxes',
      action_id: 'append',
      options: [
        {
          text: {
            type: 'plain_text',
            text: 'Добавить сотрудника?',
            emoji: true,
          },
          value: 'appeal_worker_append',
        },
      ],
    },
    label: {
      type: 'plain_text',
      text: 'Сотрудник',
      emoji: true,
    },
  };
  updatedView.blocks[4] = workerObject;
  return updatedView;
}
/**
 * Шаблон модального окна которое открывается, если поставить галочку "добавления сотрудника"
 * в модальном окне создания обращения
 * @param  {json} metadata
 */
export function appealSearchClient(metadata) {
  const template = {
    title: {
      type: 'plain_text',
      text: 'Обращение',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'Создать',
      emoji: true,
    },
    type: 'modal',
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
          text: metadata.message,
        },
      },
      {
        type: 'input',
        block_id: 'appeal_worker',
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Сотрудник',
          emoji: true,
        },
        element: {
          type: 'external_select',
          action_id: 'append',
          placeholder: {
            type: 'plain_text',
            text: 'Поиск сотрудника',
            emoji: true,
          },
          min_query_length: 0,
        },
      },
    ],
  };
  return template;
}

/**
 * Вызывается при нажатии кнопки "Не правильно?" у поля изменения компании
 * в модальном окне создания обращения
 * При нажатии так же обнуляет сотрудника
 * @param  {json} view - Предыдущее модальное окно
 */
export function modalAppealCompanyChange(view) {
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
    block_id: 'appeal_company',
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

  const workerObject = {
    type: 'input',
    block_id: 'appeal_worker',
    optional: true,
    element: {
      type: 'checkboxes',
      action_id: 'append',
      options: [
        {
          text: {
            type: 'plain_text',
            text: 'Добавить сотрудника?',
            emoji: true,
          },
          value: 'appeal_worker_append',
        },
      ],
    },
    label: {
      type: 'plain_text',
      text: 'Сотрудник',
      emoji: true,
    },
  };
  updatedView.blocks[4] = workerObject;
  return updatedView;
}

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

/**
 * Выбор причины добавления в Черный Список
 * @param  {object} message
*/
export function blacklistSelectReason(message) {
  const msg = message;
  const metadata = JSON.parse(message.actions[0].value);
  delete metadata.timestamp;
  const metadata2 = { ...metadata };
  const metadata3 = { ...metadata };
  metadata.bl_reason = 1;
  metadata2.bl_reason = 2;
  metadata3.bl_reason = 3;

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
            value: JSON.stringify(metadata),
          },
          {
            text: {
              type: 'plain_text',
              text: 'Реклама',
              emoji: true,
            },
            value: JSON.stringify(metadata2),
          },
          {
            text: {
              type: 'plain_text',
              text: 'Другая причина',
              emoji: true,
            },
            value: JSON.stringify(metadata3),
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

/**
 * Ввести другую причину для добавления в Черный Список
*/
export const blacklistOtherReason = {
  type: 'modal',
  callback_id: 'blacklist_other_reason',
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
 * Лоадер добавления номера в Черный Список
 * @param  {} message
 * @param  {} channel
 */
export function blacklistLoader(message, channel) {
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
export function blacklistMessageUpdate(message, timestamp, userId, channel, reason) {
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message,
      },
    },
    {
      type: 'divider',
    },
    {
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
    },
  ];

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
