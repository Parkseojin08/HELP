require('dotenv').config();


const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

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

// chat
const chatRoomsRouter = require('./routes/chat/rooms.js');
const chatMessagesRouter = require('./routes/chat/messages.js');
const chatGroupsRouter = require('./routes/chat/groups.js');

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

// chat
app.use('/chat/rooms', chatRoomsRouter);
app.use('/chat/messages', chatMessagesRouter);
app.use('/chat/groups', chatGroupsRouter);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        credentials: true
    }
});

io.use((socket, next) => {
    try{
        const rawCookie = socket.handshake.headers?.cookie;
        if(!rawCookie) return next(new Error("no cookie"));

        const parsed = cookie.parse(rawCookie);
        const accessToken = parsed.accessToken;
        if(!accessToken) return next(new Error("no token"));

        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);
        socket.user = decoded;
        return next();
    }catch(err){
        return next(new Error("unauthorized"));
    } 
});

require('./socket/chat')(io);

server.listen(process.env.NODE_PORT, () => {
    console.log("server start");
});


