require('dotenv').config();
const pool = require('../../db/db');

exports.searchFriendList = async (req, res) => {
    try{
        const decoded = req.user;

        if(!decoded) throw new Error("no token");

        const data = await pool.query(
            'select f.friend_count, u.username from messenger.friend f JOIN messenger.user_info u on f.friend_id = u.user_id where f.user_id = $1',
           [decoded.user_id]
        );
        if(!data.rowCount){
            res.status(404).json({
                success: false,
                message: "검색 결과가 없습니다."
            })
            return;
        }

        res.status(200).json({
            success: true,
            message: "친구 검색에 성공하였습니다.",
            data: data.rows
        });
        return;
    }catch(err){
        console.error(err.message)
        res.status(500).json({
            success: false,
            message: "서버 오류"
        })    
        return;
    }
};