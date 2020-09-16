import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { exec } from 'child_process';
import { handleExternalData, addCommentToAppealMsg } from '../modules/slack/main.mjs';
import { getClientAvatarById } from '../modules/slack/request_old.mjs';
import logger from '../modules/logger/main.mjs';

const dirname = path.resolve();

/**
 * Получили новый комментарий из CRM
 * @param  {object} req
 * @param  {object} res
 */
export function appealThread(req, res) {
  logger.trace('POST /crm/appeal_thread:', req.body);
  addCommentToAppealMsg(req.body);
  res.status(200).end();
}
/**
 * Получить логотип компании по ID
 * @param  {object} req
 * @param  {object} res
 */
export async function companyAvatar(req, res) {
  logger.trace('GET /crm/company/:id/avatar:');
  const imagePathOutput = `/upload/company/${req.params.id}_out.jpg`;
  if (fs.existsSync(dirname + imagePathOutput)) {
    res.sendFile(imagePathOutput, { root: dirname });
  } else {
    await getClientAvatarById(req.params.id);
    // Делаем ресайз изображения
    const imagePath = `/upload/company/${req.params.id}.jpg`;
    sharp(dirname + imagePath)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .resize({
        height: 400,
        width: 400,
        fit: sharp.fit.contain,
        background: {
          r: 255, g: 255, b: 255, alpha: 1,
        },
      })
      .jpeg()
      .toFile(dirname + imagePathOutput, (error, info) => {
        if (error) {
          logger.error('IMAGE RESIZE:: ERROR::', error);
        } else {
          logger.trace('IMAGE RESIZE::', info);
          // Удаляем старое изображение
          exec(`rm -r ${dirname}${imagePath}`);
          // Отправляем
          res.sendFile(imagePathOutput, { root: dirname });
        }
      });
  }
}

export function externalData(req, res) {
  const data = JSON.parse(req.body.payload);
  if (data.type === 'block_suggestion') {
    logger.debug(`POST /slack/data: Поступили данные типа: ${data.type}`);
    logger.trace('POST /slack/data:', data);
    handleExternalData(res, data);
  }
}

/*
export function actions(req, res) {
  let payload = req.body;
  if (payload.challenge) {
    res.setHeader('content-type', 'application/json');
    res.status(200).json({ challenge: payload.challenge });
  } else if (payload.payload && typeof payload.payload === 'string') {
    payload = JSON.parse(payload.payload);
    logger.debug(`POST /slack/actions: Поступили данные типа: ${payload.type}`);
    logger.trace('POST /slack/actions:', payload);
    res.status(200).end();
    slackHandleActions(payload);
  }
}
*/
/*
export function commands(req, res) {
  const payload = req.body;
  if (payload.command) {
    logger.debug(`POST /slack/commands: Поступили данные команды: ${payload.command}`);
    logger.trace('POST /slack/commands:', payload);
    res.status(200).end();
    slackHandleCommands(payload);
  }
}
*/
