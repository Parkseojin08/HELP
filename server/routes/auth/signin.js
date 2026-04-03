const express = require('express');
const routes = express.Router();
const authSignin = require('../../controller/auth/signin');

routes.post('/', authSignin.signin);

module.exports = routes;

