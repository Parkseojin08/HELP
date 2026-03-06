const express = require('express');
const router = express.Router();
const authSignup = require('../../controller/auth/signup');

router.post('/', authSignup.signup);

module.exports = router;