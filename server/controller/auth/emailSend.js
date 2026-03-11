require('dotenv').config();
const nodeMailer = require('nodemailer');
const crypto = require('crypto');
const pool = require('../../db/db')

exports.emailSend = async (req, res) => {
    try{

        const { email } = req.body;

        const transpoter = nodeMailer.createTransport({
            service: 'gmail',
            auth:{
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });
        const randoms = crypto.randomInt(100000, 999999).toString();

        const mailOpsions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: "이메일 인증.",
            html: `<h1> 인증 코드 <h1> <br> <p>${randoms}</p>`
        }

        await pool.query(
            'insert into messenger.email_verify(email, code, expired_at) values($1, $2, $3) '
            + ' ON CONFLICT (email) DO UPDATE SET code = $2, expired_at = $3, verified = false',
            [email, randoms, new Date(Date.now() + 1000 * 60 * 5)]
        )

        res.status(201).json({
            success: true,
            message: "이메일 발송 성공"
        });

        await transpoter.sendMail(mailOpsions);

    }catch(err){
        console.error(err.stack);
        res.status(500).json({
            success: false,
            message: "서버오류"
        })
    }
}