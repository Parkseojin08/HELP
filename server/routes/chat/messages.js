const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../../middleware/auth');
const messages = require('../../controller/chat/messages');

router.get('/:roomId', authMiddleware, messages.listRoomMessages);
router.post('/:roomId/read', authMiddleware, messages.markRead);

module.exports = router;

