const pool = require('../../db/db');

async function assertRoomMember(roomId, userId){
    const check = await pool.query(
        'select 1 from messenger.room_member where room_id = $1 and user_id = $2',
        [roomId, userId]
    );
    return !!check.rowCount;
}

exports.listMyRooms = async (req, res) => {
    try{
        const userId = req.user?.user_id;
        if(!userId) return res.status(401).json({ success: false, message: "로그인 필요함." });

        const data = await pool.query(
            `select
                r.room_id,
                r.type,
                r.title,
                r.created_at,
                lm.message_id as last_message_id,
                lm.message as last_message,
                lm.created_at as last_message_at,
                lm.user_id as last_message_user_id
            from messenger.room r
            join messenger.room_member rm
                on rm.room_id = r.room_id
            left join lateral (
                select m.message_id, m.message, m.created_at, m.user_id
                from messenger.message m
                where m.room_id = r.room_id
                order by m.message_id desc
                limit 1
            ) lm on true
            where rm.user_id = $1
            order by coalesce(lm.message_id, 0) desc, r.room_id desc`,
            [userId]
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

exports.createDirectRoom = async (req, res) => {
    const client = await pool.connect();
    try{
        const userId = req.user?.user_id;
        if(!userId) return res.status(401).json({ success: false, message: "로그인 필요함." });

        const friendId = Number(req.body?.friend_id);
        if(!friendId) return res.status(400).json({ success: false, message: "friend_id 필요" });
        if(friendId === userId) return res.status(400).json({ success: false, message: "본인과 채팅은 불가" });

        await client.query('begin');

        const friendExists = await client.query(
            'select 1 from messenger.user_info where user_id = $1',
            [friendId]
        );
        if(!friendExists.rowCount){
            await client.query('rollback');
            return res.status(404).json({ success: false, message: "친구를 찾을 수 없음" });
        }

        const existing = await client.query(
            `select r.room_id
             from messenger.room r
             join messenger.room_member a on a.room_id = r.room_id and a.user_id = $1
             join messenger.room_member b on b.room_id = r.room_id and b.user_id = $2
             where r.type = 'direct'
             limit 1`,
            [userId, friendId]
        );
        if(existing.rowCount){
            await client.query('commit');
            return res.status(200).json({ success: true, room_id: existing.rows[0].room_id });
        }

        const room = await client.query(
            "insert into messenger.room(type, title) values ('direct', null) returning room_id",
        );
        const roomId = room.rows[0].room_id;

        await client.query(
            'insert into messenger.room_member(room_id, user_id) values ($1, $2), ($1, $3)',
            [roomId, userId, friendId]
        );

        await client.query('commit');
        return res.status(201).json({ success: true, room_id: roomId });
    }catch(err){
        try{ await client.query('rollback'); }catch(_e){}
        console.error(err.message);
        return res.status(500).json({ success: false, message: "서버 오류" });
    } finally{
        client.release();
    }
};

exports.getRoomInfo = async (req, res) => {
    try{
        const userId = req.user?.user_id;
        if(!userId) return res.status(401).json({ success: false, message: "로그인 필요함." });

        const roomId = Number(req.params.roomId);
        if(!roomId) return res.status(400).json({ success: false, message: "roomId 필요" });

        const isMember = await assertRoomMember(roomId, userId);
        if(!isMember) return res.status(403).json({ success: false, message: "권한 없음" });

        const room = await pool.query(
            'select room_id, type, title, created_at from messenger.room where room_id = $1',
            [roomId]
        );
        if(!room.rowCount) return res.status(404).json({ success: false, message: "방 없음" });

        const members = await pool.query(
            `select u.user_id, u.username, u.profile
             from messenger.room_member rm
             join messenger.user_info u on u.user_id = rm.user_id
             where rm.room_id = $1
             order by u.user_id asc`,
            [roomId]
        );

        return res.status(200).json({
            success: true,
            room: room.rows[0],
            members: members.rows
        });
    }catch(err){
        console.error(err.message);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
};

