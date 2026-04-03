const pool = require("../../db/db");

exports.friendDelete = async (req, res) => {
    try{
    }catch(err){
        console.error(err.stack);
        res.status(500).json({
            success: false,
            message: "서버 오류입니다."
        });
    }
}