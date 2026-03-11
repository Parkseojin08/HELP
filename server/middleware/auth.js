require('dotenv').config()
const jwt = require('jsonwebtoken');

exports.authMiddleware = async (req, res, next) => {
    try{
        const accessToken = req.cookies.accessToken
        if(!accessToken) throw new Error("no token");

        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);
        req.user = decoded;

        next();
    }catch(err){
        res.status(401).json({
            success: false,
            message: "로그인 필요함."
        });
    }

    
}
