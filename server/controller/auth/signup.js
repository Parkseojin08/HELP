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
            return;
        }

        const regexPW = /^[a-zA-Z0-9!@#]{8,12}$/;

        if ( !regexPW.test(password) ){
            res.status(400).json({
                success: false,
                message: "패스워드의 조건을 충족하지 못하였습니다"
            })
            return;
        }

        const regexEM = /^[A-Za-z.0-9]+@([A-Za-z0-9]{2,}\.)+[a-zA-Z]{2,}$/;
        if(!regexEM.test(email)){
            res.status(400).json({
                success: false,
                message: "이메일의 조건을 충족하지 못하였습니다."
            })
            return;
        }

         const checkEamil = await pool.query(
               'select email from messenger.user_info  where email = $1',
            [email]
         )
         
         if(checkEamil.rowCount){
            res.status(400).json({
                success: false,
                message: "중복된 이메일 입니다."
            })
            return;
         }

        const emailVerify = await pool.query(
            'select verified from messenger.email_verify where email = $1',
            [email]
        )

        if(!(emailVerify.rowCount && emailVerify.rows[0].verified)){
            res.status(400).json({
                success: false,
                message: "이메일 인증을 받아주세요."
            })
            return;
        }

        await pool.query(
            'delete from messenger.email_verify where email = $1',
            [email]
        )

        const hash = await bcrypt.hash(password, Number(process.env.HASH));
         await pool.query(
            'insert into messenger.user_info(username, password, email) values ($1, $2, $3)',
            [username, hash, email]
        );
        
        res.status(201).json({
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

