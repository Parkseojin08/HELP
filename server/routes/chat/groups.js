const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../../middleware/auth');
const groups = require('../../controller/chat/groups');

// Group endpoints
router.get('/', authMiddleware, groups.listGroups);
router.post('/', authMiddleware, groups.createGroup);
router.get('/:groupId', authMiddleware, groups.getGroupDetail);
router.get('/:groupId/messages', authMiddleware, groups.listGroupMessages);
router.post('/:groupId/messages', authMiddleware, groups.sendGroupMessage);
router.post('/:groupId/members', authMiddleware, groups.addGroupMember);
router.delete('/:groupId/members/:memberId', authMiddleware, groups.removeGroupMember);

module.exports = router;
