const pool = require('../../db/db');

exports.friend = async (req, res) => {
    try{
        const data = req.user;
        const { friend_id } = req.body;

        const check = await pool.query(
            'select * from messenger.friend where user_id = $1 and friend_id = $2',
            [data.user_id, friend_id]
        );

        if(data.user_id === friend_id){
            res.status(400).json({
                success: false,
                message: "자신을 추가할 수 없습니다."
            })
        }

        if(check.rowCount){
            res.status(409).json({
                success: false,
                message: "이미 친구입니다." 
            });
            return;
        }

        await pool.query(
            'insert into messenger.friend(user_id, friend_id) values($1, $2)',
            [data.user_id, friend_id]
        )

        await pool.query(
            'insert into messenger.friend(user_id, friend_id) values($1, $2)',
            [friend_id, data.user_id]
        )



        res.status(201).json({
            success: true,
            message: "친구추가에 성공하였습니다!"
        })

        return;
    }catch(err){
        res.status(500).json({
            success: false,
            message: "서버 오류"
        })
        return;
    }
};