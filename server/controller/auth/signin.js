const pool = require('../../db/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.signin = async (req , res) => {
    try{

        const ip = req.ip;

        if(!(await ipCheck(ip))){
            res.status(429).json({
                success: false,
                message: "당신의 IP는 차단을 당했습니다. 15분뒤 시도해주세요."
            });            
            return;
        }

        const { email, password } = req.body;
        const data = await pool.query(
            'select user_id, username, email, password from messenger.user_info where email = $1',
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
            await ipAdd(ip);
            res.status(400).json({
                success: false,
                message: "비밀번호가 다릅니다."
            });
            return;
        }

        const payload = {
            user_id: findUser.user_id,
            username: findUser.username,
            email: findUser.email
        };

        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY , { expiresIn: '15m' });
    
        const refreshToken = jwt.sign({ user_id: findUser.user_id }, process.env.REFRESH_TOKEN_KEY , { expiresIn: '7d' })
        
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
            'update messenger.user_info set refresh_token = $1 where user_id = $2',
            [refreshToken, findUser.user_id]
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

const ipAdd = async (ip) => {
    const request = await pool.query(
        'select * from messenger.login_attempts where ip = $1',
        [ip]
    );

    if(!request.rowCount){
        await pool.query(
            'insert into messenger.login_attempts(ip, count) values ($1, $2)',
            [ip, 1]
        )
        return;
    }
    if(request.rows[0].count + 1 >= 3){
        await pool.query(
            'update messenger.login_attempts set count = 0, lock_until = $1 where ip = $2',
            [new Date(Date.now() + 1000 * 60 * 15), ip]
        )
    }else{
        await pool.query(
            'update messenger.login_attempts set count = $1 where ip = $2',
            [request.rows[0].count + 1, ip]
        )
    }
}

const ipCheck = async (ip) => {
    const request = await pool.query(
    'select lock_until from messenger.login_attempts where ip = $1'
    ,[ip])
    
    if(!request.rows[0]){
        return true
    }

    if(request.rows[0].lock_until){
        if(new Date(request.rows[0].lock_until) > new Date()){
            return false;
        }
    }

    return true;
}