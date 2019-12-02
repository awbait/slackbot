import dotenv from "dotenv";
import { formatPhoneNumber, objectAssign } from "./utils";

dotenv.config();
const frontUrl = process.env.FRONT_URL;

/**
 * Формирует сообщение при входящем звонке
 * @param  {string} phoneFrom - Номер звонящего
 * @param  {string} phoneTo - Номер на который звонят
 * @param  {object} client - Объект клиента из базы данных
 */
export function formIncallAtt(phoneFrom, phoneTo, client) {
  const phoneFromFormatted = formatPhoneNumber(phoneFrom, true);
  const phoneToFormatted = formatPhoneNumber(phoneTo);
  let message;
  if (client) {
    if (client.is_company) {
      message = `Коллеги, входящий звонок на ${phoneToFormatted}!\nПредположительно: *<${frontUrl}/#/clients/${client.id}|${client.first_name}>*\nЗвонят с номера: ${phoneFromFormatted}`;
    } else {
      message = `Коллеги, входящий звонок на ${phoneToFormatted}!\nПредположительно: *${client.first_name} ${client.last_name} ${client.middle_name}*\nЗвонят с номера: ${phoneFromFormatted}`;
    }
  } else {
    message = `Коллеги, входящий звонок на ${phoneToFormatted}!\nЗвонят с номера: ${phoneFromFormatted}`;
  }
  const template = {
    text: message,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            action_id: "blacklist_add",
            text: {
              type: "plain_text",
              emoji: true,
              text: "Добавить в ЧС"
            },
            style: "danger",
            value: `${phoneFrom},${phoneTo}`
          }
        ]
      }
    ]
  };

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
        type: "section",
        text: {
          type: "mrkdwn",
          text: message
        }
      }
    ]
  };

  return template;
}

export const searchClient = {
  type: "modal",
  external_id: "modal_searchclient_",
  title: {
    type: "plain_text",
    text: "Поиск клиента",
    emoji: true
  },
  submit: {
    type: "plain_text",
    text: "Поиск",
    emoji: true
  },
  close: {
    type: "plain_text",
    text: "Отмена",
    emoji: true
  },
  blocks: [
    {
      type: "input",
      block_id: "searchclient_phrase",
      element: {
        type: "plain_text_input",
        action_id: "phrase",
        placeholder: {
          type: "plain_text",
          text: "Начните вводить название"
        }
      },
      label: {
        type: "plain_text",
        text: "Поиск клиента",
        emoji: true
      }
    }
  ]
};

export const addPhoneBlacklist = {
  type: "modal",
  title: {
    type: "plain_text",
    text: "Добавить номер в ЧС",
    emoji: true
  },
  submit: {
    type: "plain_text",
    text: "Добавить",
    emoji: true
  },
  close: {
    type: "plain_text",
    text: "Отменить",
    emoji: true
  },
  blocks: [
    {
      type: "section",
      text: {
        type: "plain_text",
        text: "Введите причину, по которой добавляете номер в черный список.",
        emoji: true
      }
    },
    {
      type: "input",
      block_id: "blacklist_comment",
      element: {
        type: "plain_text_input",
        action_id: "comment",
        multiline: true,
        placeholder: {
          type: "plain_text",
          text: "Введите что-нибудь"
        }
      },
      label: {
        type: "plain_text",
        text: "Причина"
      }
    }
  ]
};
/**
 * Формирование модального окна с найденными клиентами
 * @param  {array} clients - Массив найденных компаний
 * @param  {string} value - Значение по которому находили компанию
 */
export function searchClientList(clients, value) {
  const clientCount = clients.length;
  const template = {
    type: "modal",
    title: {
      type: "plain_text",
      text: `Найдено ${clientCount} клиента`,
      emoji: true
    },
    submit: {
      type: "plain_text",
      text: "Вперед",
      emoji: true
    },
    close: {
      type: "plain_text",
      text: "Отмена",
      emoji: true
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:mag: Найденные результаты по: *${value}*`
        }
      }
    ]
  };
  const divider = {
    type: "divider"
  };
  if (clientCount !== 0) {
    clients.forEach(client => {
      const phone =
        client.phones.length !== 0
          ? `${formatPhoneNumber(
              client.phones.find(phoneVal => phoneVal.is_main === true)
                .tel_number,
              true
            )}`
          : "Нет данных";
      const email =
        client.emails.length !== 0
          ? client.emails.find(emailVal => emailVal.is_main === true).address
          : "Нет данных";
      let clientName = client.first_name;
      if (!client.is_company) {
        clientName = `${client.first_name} ${client.last_name} ${client.middle_name}`;
      }
      const section = {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<${this.frontUrl}/#/clients/${client.id}|${clientName}>*\n:telephone_receiver: Телефон: *${phone}*\n:email: Почта: *${email}*\n:computer: Сайт: *${client.website}*\n:office: Адрес: *Тест*`
        }
      };

      template.blocks.push(divider);
      template.blocks.push(section);
    });
  } else {
    const section = {
      type: "section",
      text: {
        type: "plain_text",
        text: ":no_entry: Клиент не найден",
        emoji: true
      }
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
    type: "actions",
    elements: [
      {
        type: "static_select",
        action_id: "blacklist_reasons",
        placeholder: {
          type: "plain_text",
          text: "Выберите причину",
          emoji: true
        },
        confirm: {
          title: {
            type: "plain_text",
            text: "Подтверждение"
          },
          text: {
            type: "mrkdwn",
            text: "Вы подтверждаете добавление номера в черный список?"
          },
          confirm: {
            type: "plain_text",
            text: "Добавить"
          },
          deny: {
            type: "plain_text",
            text: "Отменить"
          }
        },
        options: [
          {
            text: {
              type: "plain_text",
              text: "Спам",
              emoji: true
            },
            value: `${value},${1}`
          },
          {
            text: {
              type: "plain_text",
              text: "Реклама",
              emoji: true
            },
            value: `${value},${2}`
          },
          {
            text: {
              type: "plain_text",
              text: "Другая причина",
              emoji: true
            },
            value: `${value},${3}`
          }
        ]
      }
    ]
  };

  msg.message.blocks[1] = messageBlock;
  const objectArg = {
    channel: msg.channel.id,
    ts: msg.message.ts,
    blocks: msg.message.blocks
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
export function blacklistMessageUpdate(
  userId,
  timestamp,
  channel,
  reason,
  phoneFrom,
  phoneTo
) {
  const phoneFromFormatted = formatPhoneNumber(phoneFrom, true);
  const phoneToFormatted = formatPhoneNumber(phoneTo);

  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `Коллеги, входящий звонок на ${phoneToFormatted}!\n` +
          `Звонят с номера: ${phoneFromFormatted}`,
        verbatim: false
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:x: <@${userId}> добавил номер в черный список: ${reason}`
      }
    }
  ];
  const objectArg = {
    channel,
    ts: timestamp,
    blocks
  };
  return objectArg;
}

export function notifyAddStatus(message, currentMsgStatus) {
  const statuses = {
    ":hammer_and_pick: В работе": "value-1",
    ":question: Недостаточно информации": "value-2",
    ":heavy_check_mark: Решена": "value-3",
    ":recycle: Обрабатывается": "value-4",
    ":lock: Закрыта": "value-5"
  };
  let initialStatus = "";
  let initialComment = "";
  let initialStatusObject;
  if (currentMsgStatus) {
    const temp = currentMsgStatus.split(":* ");
    initialStatus = temp[1].split("\n :memo:")[0];
    initialComment = temp[2];
    if (!initialComment) {
      initialComment = "";
    }
    initialStatusObject = {
      initial_option: {
        text: {
          type: "plain_text",
          text: initialStatus,
          emoji: true
        },
        value: statuses[initialStatus]
      }
    };
  }
  let template = {
    type: "modal",
    title: {
      type: "plain_text",
      text: "Добавить комментарий",
      emoji: true
    },
    submit: {
      type: "plain_text",
      text: "Добавить",
      emoji: true
    },
    close: {
      type: "plain_text",
      text: "Отмена",
      emoji: true
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message
        }
      },
      {
        type: "input",
        block_id: "notify_status",
        label: {
          type: "plain_text",
          text: "Установить статус",
          emoji: true
        },
        element: {
          type: "static_select",
          action_id: "status",
          placeholder: {
            type: "plain_text",
            text: "Выберите статус",
            emoji: true
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: ":hammer_and_pick: В работе",
                emoji: true
              },
              value: "value-1"
            },
            {
              text: {
                type: "plain_text",
                text: ":question: Недостаточно информации",
                emoji: true
              },
              value: "value-2"
            },
            {
              text: {
                type: "plain_text",
                text: ":heavy_check_mark: Решена",
                emoji: true
              },
              value: "value-3"
            },
            {
              text: {
                type: "plain_text",
                text: ":recycle: Обрабатывается",
                emoji: true
              },
              value: "value-4"
            },
            {
              text: {
                type: "plain_text",
                text: ":lock: Закрыта",
                emoji: true
              },
              value: "value-5"
            }
          ],
          initial_option: {
            text: {
              type: 'plain_text',
              text: ':hammer_and_pick: В работе',
              emoji: true,
            },
            value: 'value-1',
          },
        }
      },
      {
        type: "input",
        block_id: "notify_comment",
        optional: true,
        label: {
          type: "plain_text",
          text: "Комментарий",
          emoji: true
        },
        element: {
          type: "plain_text_input",
          action_id: "comment",
          initial_value: `${initialComment}`,
          multiline: true,
          placeholder: {
            type: "plain_text",
            text: "Введите комментарий",
            emoji: true
          }
        }
      }
    ]
  };
  
  if (currentMsgStatus) {
    const element = objectAssign(template.blocks[1].element, initialStatusObject);
    template.blocks[1].element = element;
  }
  return template;
}

export function notifyUpdateStatus(
  channel,
  timestamp,
  message,
  status,
  comment
) {
  const statusText = `:information_source: *Статус:* ${status}\n`;
  const commentText = comment ? `:memo: *Комментарий:* ${comment}` : "";
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: message
      },
      accessory: {
        type: "button",
        action_id: "status_edit",
        text: {
          type: "plain_text",
          text: "Изменить статус",
          emoji: true
        },
        value: "click_me_123"
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${statusText} ${commentText}`
        }
      ]
    }
  ];
  const objectArg = {
    channel,
    ts: timestamp,
    blocks
  };
  return objectArg;
}
