const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../../middleware/auth');
const rooms = require('../../controller/chat/rooms');

router.get('/', authMiddleware, rooms.listMyRooms);
router.post('/direct', authMiddleware, rooms.createDirectRoom);
router.get('/:roomId', authMiddleware, rooms.getRoomInfo);

module.exports = router;

