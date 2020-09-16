import express from 'express';
import * as SlackController from './controllers/SlackController.mjs';

const routes = express.Router();

routes.get('/crm/company/:id/avatar', SlackController.companyAvatar);
routes.post('/crm/appeal_thread', SlackController.appealThread);
routes.post('/slack/data', SlackController.externalData);

// routes.post('/slack/actions', SlackController.actions);
// routes.post('/slack/commands', SlackController.commands);

export default routes;
