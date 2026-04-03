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
const emailSendAuthRouter = require('./routes/auth/emailSend.js');
const emailVerifyAuthController = require('./routes/auth/emailVerify.js');
const signinAuthRouter = require('./routes/auth/signin.js');
const meAuthRouter = require('./routes/auth/me.js');
const logoutAuthRouter = require('./routes/auth/logout.js');


// search 
const friendSearchRouter = require('./routes/search/friend.js')
const friendListSearchRouter = require('./routes/search/friendList.js')

// add
const friendAddRouter = require('./routes/add/friend.js');

// 회원가입 로직
app.use('/auth/signup', signupAuthRouter);
app.use('/auth/email-send', emailSendAuthRouter);
app.use('/auth/email-verify', emailVerifyAuthController);
app.use('/auth/signin', signinAuthRouter);
app.use('/auth/me', meAuthRouter);
app.use('/auth/logout', logoutAuthRouter);

// search
app.use('/search/friend', friendSearchRouter);
app.use('/search/friendlist', friendListSearchRouter);

// add
app.use('/add/friend', friendAddRouter);

app.listen(process.env.NODE_PORT, () => {
    console.log("server start");
});


