require('dotenv').config();


const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());


const signupRouter  = require('./routes/auth/signup.js');
const signinRouter = require('./routes/auth/signin.js');
const meRouter = require('./routes/auth/me.js');


// 회원가입 로직
app.use('/auth/signup', signupRouter);
app.use('/auth/signin', signinRouter)
app.use('/auth/me', meRouter);

app.listen(process.env.NODE_PORT, () => {
    console.log("server start");
});


