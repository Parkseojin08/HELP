const pool = require('../../db/db');

// Helper function to check if user is a member of a group
async function assertGroupMember(groupId, userId) {
    const check = await pool.query(
        'SELECT 1 FROM messenger.group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
    );
    return !!check.rowCount;
}

// Helper function to check if user is the group creator
async function assertGroupCreator(groupId, userId) {
    const check = await pool.query(
        'SELECT 1 FROM messenger.groups WHERE group_id = $1 AND created_by = $2',
        [groupId, userId]
    );
    return !!check.rowCount;
}

// GET /api/chat/groups - List all groups for current user (OPTIMIZED)
exports.listGroups = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ success: false, message: "로그인 필요함." });

        // OPTIMIZED: Single query with efficient JOINs and window functions
        const data = await pool.query(
            `SELECT 
                g.group_id,
                g.name,
                g.description,
                (SELECT COUNT(*) FROM messenger.group_members WHERE group_id = g.group_id) as member_count,
                g.created_at,
                g.updated_at,
                lm.message as last_message,
                lm.message_id as last_message_id,
                lm.created_at as last_message_at,
                lm.user_id as last_message_user_id
            FROM messenger.groups g
            JOIN messenger.group_members gm ON g.group_id = gm.group_id AND gm.user_id = $1
            LEFT JOIN LATERAL (
                SELECT message_id, message, created_at, user_id
                FROM messenger.group_messages
                WHERE group_id = g.group_id
                ORDER BY created_at DESC
                LIMIT 1
            ) lm ON true
            ORDER BY g.updated_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            data: data.rows
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// POST /api/chat/groups - Create a new group
exports.createGroup = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ success: false, message: "로그인 필요함." });

        const { name, description } = req.body;
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: "그룹명은 필수입니다" });
        }

        await client.query('BEGIN');

        // Create group
        const groupResult = await client.query(
            `INSERT INTO messenger.groups(name, description, created_by)
             VALUES ($1, $2, $3)
             RETURNING group_id, name, description, created_at`,
            [name.trim(), description?.trim() || null, userId]
        );

        const groupId = groupResult.rows[0].group_id;

        // Add creator as member with admin role
        await client.query(
            `INSERT INTO messenger.group_members(group_id, user_id, role)
             VALUES ($1, $2, $3)`,
            [groupId, userId, 'admin']
        );

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            data: {
                group_id: groupId,
                name: groupResult.rows[0].name,
                description: groupResult.rows[0].description,
                created_at: groupResult.rows[0].created_at,
                member_count: 1
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        return res.status(500).json({ success: false, message: "서버 오류" });
    } finally {
        client.release();
    }
};

// GET /api/chat/groups/:groupId - Get group details
exports.getGroupDetail = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ success: false, message: "로그인 필요함." });

        const groupId = Number(req.params.groupId);
        if (!groupId) return res.status(400).json({ success: false, message: "groupId 필요" });

        // Check if user is a member of the group
        const isMember = await assertGroupMember(groupId, userId);
        if (!isMember) return res.status(403).json({ success: false, message: "권한 없음" });

        // Get group details
        const groupData = await pool.query(
            `SELECT 
                g.group_id,
                g.name,
                g.description,
                g.created_by,
                COUNT(DISTINCT gm.user_id) as member_count,
                g.created_at,
                g.updated_at
            FROM messenger.groups g
            LEFT JOIN messenger.group_members gm ON g.group_id = gm.group_id
            WHERE g.group_id = $1
            GROUP BY g.group_id`,
            [groupId]
        );

        if (!groupData.rowCount) {
            return res.status(404).json({ success: false, message: "그룹을 찾을 수 없습니다" });
        }

        // Get group members
        const membersData = await pool.query(
            `SELECT 
                gm.user_id,
                u.username,
                gm.role,
                gm.joined_at
            FROM messenger.group_members gm
            JOIN messenger.user_info u ON gm.user_id = u.user_id
            WHERE gm.group_id = $1
            ORDER BY gm.joined_at ASC`,
            [groupId]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...groupData.rows[0],
                members: membersData.rows
            }
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// GET /api/chat/groups/:groupId/messages - Get group messages with cursor-based pagination
exports.listGroupMessages = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ success: false, message: "로그인 필요함." });

        const groupId = Number(req.params.groupId);
        if (!groupId) return res.status(400).json({ success: false, message: "groupId 필요" });

        // Check if user is a member of the group
        const isMember = await assertGroupMember(groupId, userId);
        if (!isMember) return res.status(403).json({ success: false, message: "권한 없음" });

        const limit = Math.min(Number(req.query.limit) || 50, 100);
        const cursor = req.query.cursor ? Number(req.query.cursor) : null;

        // OPTIMIZED: Cursor-based pagination to avoid OFFSET scanning
        let query = `SELECT
                gm.message_id,
                gm.group_id,
                gm.user_id,
                u.username,
                gm.message,
                gm.created_at,
                gm.updated_at
            FROM messenger.group_messages gm
            JOIN messenger.user_info u ON u.user_id = gm.user_id
            WHERE gm.group_id = $1`;

        const params = [groupId];

        // If cursor provided, fetch messages before the cursor
        if (cursor) {
            query += ` AND gm.message_id < $2`;
            params.push(cursor);
        }

        query += ` ORDER BY gm.message_id DESC
            LIMIT $${params.length + 1}`;
        params.push(limit + 1); // Fetch one extra to determine if there are more

        const data = await pool.query(query, params);
        const rows = data.rows;
        
        // Check if there are more messages
        let hasMore = false;
        if (rows.length > limit) {
            rows.pop(); // Remove the extra row
            hasMore = true;
        }

        // Get next cursor (lowest message_id in the result)
        const nextCursor = rows.length > 0 ? rows[rows.length - 1].message_id : null;

        return res.status(200).json({
            success: true,
            data: {
                messages: rows.reverse(), // Return in ascending order
                pagination: {
                    cursor: nextCursor,
                    hasMore: hasMore,
                    count: rows.length
                }
            }
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// POST /api/chat/groups/:groupId/members - Add member to group
exports.addGroupMember = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ success: false, message: "로그인 필요함." });

        const groupId = Number(req.params.groupId);
        const { user_id: newUserId } = req.body;

        if (!groupId) return res.status(400).json({ success: false, message: "groupId 필요" });
        if (!newUserId) return res.status(400).json({ success: false, message: "user_id 필요" });

        // Check if current user is group creator/admin
        const isCreator = await assertGroupCreator(groupId, userId);
        if (!isCreator) return res.status(403).json({ success: false, message: "권한 없음" });

        // Check if user already exists
        const existingMember = await pool.query(
            'SELECT 1 FROM messenger.group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, newUserId]
        );

        if (existingMember.rowCount) {
            return res.status(409).json({ success: false, message: "이미 그룹 멤버입니다" });
        }

        // Add new member
        const result = await client.query(
            `INSERT INTO messenger.group_members(group_id, user_id, role)
             VALUES ($1, $2, $3)
             RETURNING group_id, user_id, joined_at, role`,
            [groupId, newUserId, 'member']
        );

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: "서버 오류" });
    } finally {
        client.release();
    }
};

// DELETE /api/chat/groups/:groupId/members/:memberId - Remove member from group
exports.removeGroupMember = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ success: false, message: "로그인 필요함." });

        const groupId = Number(req.params.groupId);
        const memberId = Number(req.params.memberId);

        if (!groupId || !memberId) {
            return res.status(400).json({ success: false, message: "groupId 또는 memberId 필요" });
        }

        // Check if current user is group creator/admin
        const isCreator = await assertGroupCreator(groupId, userId);
        if (!isCreator) return res.status(403).json({ success: false, message: "권한 없음" });

        // Check if member exists
        const member = await pool.query(
            'SELECT 1 FROM messenger.group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, memberId]
        );

        if (!member.rowCount) {
            return res.status(404).json({ success: false, message: "멤버를 찾을 수 없습니다" });
        }

        // Cannot remove creator
        if (memberId === userId) {
            return res.status(400).json({ success: false, message: "자신을 그룹에서 제거할 수 없습니다" });
        }

        await pool.query(
            'DELETE FROM messenger.group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, memberId]
        );

        return res.status(200).json({ success: true, message: "멤버가 제거되었습니다" });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

// POST /api/chat/groups/:groupId/messages - Send a message to group (OPTIMIZED)
exports.sendGroupMessage = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ success: false, message: "로그인 필요함." });

        const groupId = Number(req.params.groupId);
        const { message } = req.body;

        if (!groupId) return res.status(400).json({ success: false, message: "groupId 필요" });
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ success: false, message: "메시지는 필수입니다" });
        }

        // Check if user is a member of the group
        const isMember = await assertGroupMember(groupId, userId);
        if (!isMember) return res.status(403).json({ success: false, message: "권한 없음" });

        // Insert message (OPTIMIZED: Single query with RETURNING)
        const result = await client.query(
            `INSERT INTO messenger.group_messages(group_id, user_id, message)
             VALUES ($1, $2, $3)
             RETURNING message_id, group_id, user_id, message, created_at`,
            [groupId, userId, message.trim()]
        );

        const messageData = result.rows[0];

        // Get username in a single query
        const userResult = await client.query(
            'SELECT username FROM messenger.user_info WHERE user_id = $1',
            [userId]
        );

        return res.status(201).json({
            success: true,
            data: {
                ...messageData,
                username: userResult.rows[0]?.username
            }
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: "서버 오류" });
    } finally {
        client.release();
    }
};
