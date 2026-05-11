const pool = require('../../db/db');

async function assertRoomMember(roomId, userId){
    const check = await pool.query(
        'select 1 from messenger.room_member where room_id = $1 and user_id = $2',
        [roomId, userId]
    );
    return !!check.rowCount;
}

exports.listRoomMessages = async (req, res) => {
    try{
        const userId = req.user?.user_id;
        if(!userId) return res.status(401).json({ success: false, message: "로그인 필요함." });

        const roomId = Number(req.params.roomId);
        if(!roomId) return res.status(400).json({ success: false, message: "roomId 필요" });

        const isMember = await assertRoomMember(roomId, userId);
        if(!isMember) return res.status(403).json({ success: false, message: "권한 없음" });

        const limit = Math.min(Number(req.query.limit) || 30, 100);
        const before = Number(req.query.before) || null; // message_id cursor

        const params = [roomId, limit];
        let where = 'm.room_id = $1';
        if(before){
            params.push(before);
            where += ` and m.message_id < $3`;
        }

        const data = await pool.query(
            `select
                m.message_id,
                m.message,
                m.created_at,
                m.user_id,
                u.username,
                u.profile
            from messenger.message m
            join messenger.user_info u on u.user_id = m.user_id
            where ${where}
            order by m.message_id desc
            limit $2`,
            params
        );

        return res.status(200).json({
            success: true,
            data: data.rows
        });
    }catch(err){
        console.error(err.message);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

exports.markRead = async (req, res) => {
    try{
        const userId = req.user?.user_id;
        if(!userId) return res.status(401).json({ success: false, message: "로그인 필요함." });

        const roomId = Number(req.params.roomId);
        const messageId = Number(req.body?.message_id);
        if(!roomId || !messageId) return res.status(400).json({ success: false, message: "roomId/message_id 필요" });

        const isMember = await assertRoomMember(roomId, userId);
        if(!isMember) return res.status(403).json({ success: false, message: "권한 없음" });

        const belongs = await pool.query(
            'select 1 from messenger.message where message_id = $1 and room_id = $2',
            [messageId, roomId]
        );
        if(!belongs.rowCount) return res.status(404).json({ success: false, message: "메시지 없음" });

        await pool.query(
            `insert into messenger.read_check(user_id, message_id)
             values ($1, $2)
             on conflict do nothing`,
            [userId, messageId]
        );

        return res.status(200).json({ success: true });
    }catch(err){
        console.error(err.message);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

