const express = require('express');
const router = express.Router();
const friendAddController = require('../../controller/add/friend.js');

const { authMiddleware } = require('../../middleware/auth.js');

router.post('/', authMiddleware, friendAddController.friend);

module.exports = router;