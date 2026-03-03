require('dotenv').config();


const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
    res.status(200).json({
        id: "test 입니다."
    })
})

app.listen(process.env.NODE_PORT, () => {
    console.log("server start 5000 PORT");
});


