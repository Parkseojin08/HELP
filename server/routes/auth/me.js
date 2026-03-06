const express = require('express');
const routes = express.Router();
const meController = require('../../controller/auth/me')

routes.get('/', meController.me);

module.exprots = routes;