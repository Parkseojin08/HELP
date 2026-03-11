const express = require('express');
const router = express.Router();
const searchFriend = require('../../controller/search/friendList');

const { authMiddleware } = require('../../middleware/auth');

router.get('/', authMiddleware, searchFriend.searchFriendList);

module.exports = router;
