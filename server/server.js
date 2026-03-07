require('dotenv').config();


const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// auth
const signupAuthRouter  = require('./routes/auth/signup.js');
const signinAuthRouter = require('./routes/auth/signin.js');
const meAuthRouter = require('./routes/auth/me.js');


// 회원가입 로직
app.use('/auth/signup', signupAuthRouter);
app.use('/auth/signin', signinAuthRouter)
app.use('/auth/me', meAuthRouter);

app.listen(process.env.NODE_PORT, () => {
    console.log("server start");
});


