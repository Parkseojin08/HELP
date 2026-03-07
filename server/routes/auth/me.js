const express = require('express');
const routes = express.Router();
const authMe = require('../../controller/auth/me')

routes.get('/', authMe.me);

module.exprots = routes;