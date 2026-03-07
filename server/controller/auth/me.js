require('dotenv').config();

const jwt = require('jsonwebtoken');
const pool = require('../../db/db')

exports.me = async (req, res) => {
    try{
        const accessToken = req.cookies.accessToken;
        if(!accessToken) throw new Error('NO AccessToken');

        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);
 
        res.status(200).json({
            success: true,
            message: "토근이 존재함.",
            userInfo: decoded
        });
        return;
        

    }catch(err){
        try{ 
            const refreshToken = req.cookies.refreshToken;
            
            if(!refreshToken) throw new Error("No RefreshToken");
            
            const checkRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
            
            const dbRefreshToken = await pool.query(
                'select refresh_token from messenger.user_info where id = $1',
                [checkRefreshToken.id]
            );

            if(refreshToken !== dbRefreshToken.rows[0].refresh_token){

                await pool.query(
                    'update messenger.user_info set refresh_token = null where id = $1',
                    [checkRefreshToken.id]
                )
                res.clearCookie('refreshToken');
                res.status(401).json({
                    success: false,
                    message: "로그인 필요"
                });


                return;
            }

            if(checkRefreshToken){
                const data = await pool.query(
                    'select id, username, email from messenger.user_info where id = $1',
                    [checkRefreshToken.id]
                );
                const findUser = data.rows[0];

                const payload = {
                    id: findUser.id,
                    username: findUser.username,
                    email: findUser.email
                };
        
                const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY , { expiresIn: '15m' });
                    

                res.cookie('accessToken', accessToken,{
                    httpOnly: true,
                    secure: false,
                    sameSite: 'lax',
                    maxAge: 1000 * 60 * 15
                });
                res.status(200).json({
                    success: true,
                    message: "AccessToken 발급 성공",
                    userInfo: payload
                });
                return;
            }
        }catch(err){
            res.status(401).json({
                success: false,
                message: "로그인 필요"
            })
        }
    }
}