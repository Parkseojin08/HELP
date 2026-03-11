require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('../../db/db');

exports.logout = async (req, res) => {
    try{
        const accessToken = req.cookies.accessToken;

        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);

        await pool.query(
            'update messenger.user_info set refresh_token = null where id = $1',
            [decoded.id]
        );

        return;
    }catch(err){

    }  finally {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.status(200).json({ success: true, message: "로그아웃 되었습니다." });
    }
}