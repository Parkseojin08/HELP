const express = require('express');
const router = express.Router();
const authLogout = require('../../controller/auth/logout');

router.post('/', authLogout.logout);

module.exports = router;
