import { formatPhoneNumber } from '../other/utils.mjs';

const frontUrl = process.env.FRONT_URL;

/**
 * Функция формирования
 *
 * @param  {string} phoneFrom - Номер телефона с которого совершен вызов
 * @param  {string} phoneTo - Номер телефона на который совершен вызов
 * @param  {object} company - Объект информации о компании
 */
export function incomingCallCompanyTemplate(channelType, phoneFrom, phoneTo, company) {
  const phoneFromFormatted = formatPhoneNumber(phoneFrom, true);
  const phoneToFormatted = formatPhoneNumber(phoneTo);

  const data = {
    phone_from: phoneFrom,
    phone_to: phoneTo,
    company_id: company.id,
    timestamp: new Date(),
  };

  const messagePretext = `Входящий звонок на ${phoneToFormatted}! Компания: ${company.first_name}`;
  const message = `Коллеги, входящий звонок: ${phoneFromFormatted}`;

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
        elements: [
          {
            type: 'mrkdwn',
            text: `:office: *Компания:* <${frontUrl}/#/clients/${company.id}|${company.first_name}>`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [],
      },
    ],
  };

  const buttonsSupport = [
    {
      type: 'button',
      action_id: 'fake_call',
      text: {
        type: 'plain_text',
        emoji: true,
        text: 'Ложный вызов',
      },
      value: JSON.stringify(data),
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
      value: JSON.stringify(data),
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
      value: JSON.stringify(data),
    },
  ];

  const buttonsCalls = [
    {
      type: 'button',
      action_id: 'fake_call',
      text: {
        type: 'plain_text',
        emoji: true,
        text: 'Ложный вызов',
      },
      value: JSON.stringify(data),
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
      value: JSON.stringify(data),
    },
  ];

  switch (channelType) {
    case 'support':
      template.blocks[2].elements = buttonsSupport;
      break;
    case 'calls':
      template.blocks[2].elements = buttonsCalls;
      break;
    default:
      template.blocks[2].elements = buttonsCalls;
      break;
  }

  return template;
}

export function incomingCallNotificationMessageTemplateCompanyWorker() {
  let template;

  return template;
}
