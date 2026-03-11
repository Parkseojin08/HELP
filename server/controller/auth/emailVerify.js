const pool = require('../../db/db');


exports.emailVerify = async (req, res) => {
    try{
        const { email, code } = req.body;
        
        const data = await pool.query(
            'select * from messenger.email_verify where email = $1',
            [email]
        )

        if(!data.rowCount){
            res.status(400).json({
                success: false,
                message: "이메일 요청이 확인되지 않았습니다."
            });
            return;
        }

        if(new Date(data.rows[0].expired_at) < new Date(Date.now())){
            res.status(400).json({
                success: false,
                message: "요청시간을 초과하였습니다."
            });
            return;
        };

        if(!(data.rows[0].code === code)){
            res.status(400).json({
                success: false,
                message: "요청 코드가 다릅니다."
            })
            return;
        }

        await pool.query(
            'update messenger.email_verify set verified = true where email = $1',
            [email]
        )

        res.status(201).json({
            success: true,
            message: "인증에 성공하였습니다!"
        })
        return;

    }catch(err){
        res.status(500).json({
            success: false,
            message: "서버오류"
        })
    }
}