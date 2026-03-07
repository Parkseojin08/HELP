const pool = require('../../db/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.signin = async (req , res) => {
    try{
        const { email, password } = req.body;
        const data = await pool.query(
            'select id, username, email, password from messenger.user_info where email = $1',
            [email]
        );
        const findUser = data.rows[0];
          if(!findUser){
            res.status(400).json({
                success: false,
                message: "실패했습니다" 
            })
            return;
        }

        const check = await bcrypt.compare(password, findUser.password);

        if(!check){
            res.status(400).json({
                success: false,
                message: "비밀번호가 다릅니다."
            });
            return;
        }

        const payload = {
            id: findUser.id,
            username: findUser.username,
            email: findUser.email
        };

        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY , { expiresIn: '15m' });
    
        const refreshToken = jwt.sign({ id: findUser.id }, process.env.REFRESH_TOKEN_KEY , { expiresIn: '7d' })
        
        res.cookie('accessToken', accessToken,{
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 15
        });


        res.cookie('refreshToken', refreshToken ,{
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7
        });

        await pool.query(
            'update messenger.user_info set refresh_token = $1 where id = $2',
            [refreshToken, findUser.id]
        );


        res.status(200).json({
            success: true,
            message: "로그인에 성공하였습니다."
        });
        return;
    } catch(err){
        console.error(err.message);
        res.status(500).json({
            message: "서버 오류"
        })
        return;
    }
}
