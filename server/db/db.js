require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    
    // Connection pool optimization
    max: 20,                      // 최대 연결 수 (동시 요청 처리)
    min: 5,                       // 최소 연결 수 (유휴 연결 유지)
    idleTimeoutMillis: 30000,     // 유휴 연결 타임아웃 (30초)
    connectionTimeoutMillis: 5000, // 연결 타임아웃 (5초)
    max_lifetime: 600000,         // 연결 최대 수명 (10분)
});

// Connection error handling
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Monitor pool state in development
if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
        console.log(`[DB Pool] Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
    }, 60000); // Every 60 seconds
}

module.exports = pool;