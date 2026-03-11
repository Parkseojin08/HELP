const express = require('express');
const router = express.Router();
const searchFriend = require('../../controller/search/friend');

const { authMiddleware } = require('../../middleware/auth');

router.get('/', authMiddleware , searchFriend.searchFriend);

module.exports = router;