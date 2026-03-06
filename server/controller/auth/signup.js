require('dotenv').config();
const pool = require('../../db/db');
const bcrypt = require('bcrypt');

exports.signup = async (req, res) => {
    try{
        const { username, password, email } = req.body; 

        if(!username || !password || !email){
            res.status(400).json({
                success: false,
                message: "모든 항목을 입력해주세요."
            })  
            return;
        }

        const regexUN = /^[a-zA-Z가-힣0-9]{1,16}$/;
        if (!regexUN.test(username)){
            res.status(400).json({
                success: false,
                message: "이름의 조건을 충족하지 못하였습니다."
            })
            
        }

        const regexPW = /^[a-zA-Z0-9!@#]{8,12}$/;

        if ( !regexPW.test(password) ){
            res.status(400).json({
                success: false,
                message: "패스워드의 조건을 충족하지 못하였습니다"
            })
            return;
        }

        const regexEM = /^[A-Za-z.0-9]+@[A-Za-z.]{2,}\.[A-Za-z]{2,}$/;
        if(!regexEM.test(email)){
            res.status(400).json({
                success: false,
                message: "이메일의 조건을 충족하지 못하였습니다."
            })
            return;
        }

         const checkEamil = await pool.query(
               'select email from messenger.userinfo  where email = $1',
            [email]
         )
         
         if(checkEamil.rowCount){
            res.status(400).json({
                success: false,
                message: "중복된 이메일 입니다."
            })
         }

        const hash = await bcrypt.hash(password, Number(process.env.HASH));
        const request = await pool.query(
            'insert into messenger.userinfo(username, password, email) values ($1, $2, $3)',
            [username, hash, email]
        );
        
        res.status(200).json({
            success: true,
            message: "회원가입에 성공하였습니다."
        });

    } catch (err){
        res.status(500).json({
            success: false,
            message: "회원가입에 실해하였습니다."
        })
        return;
    }
}

