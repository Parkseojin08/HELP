const express = require('express');
const router = express.Router();
const emailVerifyAuthController = require('../../controller/auth/emailVerify.js');

router.post('/', emailVerifyAuthController.emailVerify);

module.exports = router;