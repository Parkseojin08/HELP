const express = require('express');
const router = express.Router();
const friendDeleteController = require('../../controller/delete/friend.js');

const {authMiddleware} = require('../../middleware/auth');

router.delete('/', authMiddleware, friendDeleteController.friendDelete);

module.exports = router;