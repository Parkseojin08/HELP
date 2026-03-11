const pool = require('../../db/db');

exports.searchFriend = async (req, res) => {
    try{
        const { email } = req.query;

        const data = await pool.query(
            'select * from messenger.user_info where email = $1',
            [email]
        )

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
            data: data.rows[0]
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