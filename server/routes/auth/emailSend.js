const express = require('express');
const router = express.Router();
const emailSendController = require('../../controller/auth/emailSend')

router.post('/', emailSendController.emailSend);

module.exports = router;
