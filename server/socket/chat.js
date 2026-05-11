const pool = require('../db/db');

// Message batching for performance optimization
const messageBatches = new Map(); // { groupId: { batchQueue: [], timer: null } }
const BATCH_INTERVAL = 100; // 100ms
const BATCH_SIZE = 50; // Max messages per batch

async function assertRoomMember(roomId, userId){
    const check = await pool.query(
        'select 1 from messenger.room_member where room_id = $1 and user_id = $2',
        [roomId, userId]
    );
    return !!check.rowCount;
}

async function assertGroupMember(groupId, userId){
    const check = await pool.query(
        'select 1 from messenger.group_members where group_id = $1 and user_id = $2',
        [groupId, userId]
    );
    return !!check.rowCount;
}

/**
 * Get or create batch queue for a group
 */
function getBatchQueue(groupId) {
    if (!messageBatches.has(groupId)) {
        messageBatches.set(groupId, {
            batchQueue: [],
            timer: null
        });
    }
    return messageBatches.get(groupId);
}

/**
 * Flush batch queue - send all queued messages at once
 */
function flushBatchQueue(io, groupId) {
    const batch = getBatchQueue(groupId);
    
    if (batch.batchQueue.length === 0) return;

    console.log(`[Socket] Flushing ${batch.batchQueue.length} messages for group ${groupId}`);
    
    // Send all messages in one emit
    io.to(`group:${groupId}`).emit('group_messages_batch', {
        group_id: groupId,
        messages: batch.batchQueue,
        count: batch.batchQueue.length
    });

    // Clear the batch
    batch.batchQueue = [];
    batch.timer = null;
}

/**
 * Add message to batch queue
 */
function addToBatch(io, groupId, messageData) {
    const batch = getBatchQueue(groupId);
    
    batch.batchQueue.push(messageData);

    // If batch is full, flush immediately
    if (batch.batchQueue.length >= BATCH_SIZE) {
        if (batch.timer) clearTimeout(batch.timer);
        flushBatchQueue(io, groupId);
        return;
    }

    // Schedule flush if not already scheduled
    if (!batch.timer) {
        batch.timer = setTimeout(() => {
            flushBatchQueue(io, groupId);
        }, BATCH_INTERVAL);
    }
}

module.exports = (io) => {
    // Cleanup on server shutdown
    process.on('SIGTERM', () => {
        messageBatches.forEach((batch, groupId) => {
            flushBatchQueue(io, groupId);
        });
    });

    io.on('connection', (socket) => {
        const userId = socket.user?.user_id;
        const username = socket.user?.username;

        // Log connection
        console.log(`[Socket] User ${userId} (${username}) connected`);

        socket.on('join_room', async ({ roomId }) => {
            try{
                const rid = Number(roomId);
                if(!rid) return socket.emit('error_message', { message: 'roomId 필요' });
                const ok = await assertRoomMember(rid, userId);
                if(!ok) return socket.emit('error_message', { message: '권한 없음' });

                await socket.join(`room:${rid}`);
                socket.emit('joined_room', { roomId: rid });
            }catch(err){
                console.error('[Socket] join_room error:', err.message);
                socket.emit('error_message', { message: 'join 실패', error: err.message });
            }
        });

        socket.on('send_message', async ({ roomId, message }) => {
            const client = await pool.connect();
            try{
                const rid = Number(roomId);
                const text = (message ?? '').toString().trim();
                if(!rid || !text) return;

                const ok = await assertRoomMember(rid, userId);
                if(!ok) return socket.emit('error_message', { message: '권한 없음' });

                const saved = await client.query(
                    `insert into messenger.message(message, user_id, room_id)
                     values ($1, $2, $3)
                     returning message_id, created_at`,
                    [text, userId, rid]
                );

                const payload = {
                    room_id: rid,
                    message_id: saved.rows[0].message_id,
                    message: text,
                    created_at: saved.rows[0].created_at,
                    user_id: userId,
                    username: username
                };

                io.to(`room:${rid}`).emit('new_message', payload);
            }catch(err){
                console.error('[Socket] send_message error:', err.message);
                socket.emit('error_message', { message: 'send 실패', error: err.message });
            } finally{
                client.release();
            }
        });

        socket.on('read_message', async ({ roomId, messageId }) => {
            try{
                const rid = Number(roomId);
                const mid = Number(messageId);
                if(!rid || !mid) return;

                const ok = await assertRoomMember(rid, userId);
                if(!ok) return;

                await pool.query(
                    `insert into messenger.read_check(user_id, message_id)
                     values ($1, $2)
                     on conflict do nothing`,
                    [userId, mid]
                );

                io.to(`room:${rid}`).emit('read_update', { room_id: rid, user_id: userId, message_id: mid });
            }catch(err){
                console.error('[Socket] read_message error:', err.message);
                socket.emit('error_message', { message: 'read 실패', error: err.message });
            }
        });

        // ===== Group Chat Events (OPTIMIZED) =====

        socket.on('join_group', async ({ groupId }) => {
            try{
                const gid = Number(groupId);
                if(!gid) return socket.emit('error_message', { message: 'groupId 필요' });

                const ok = await assertGroupMember(gid, userId);
                if(!ok) return socket.emit('error_message', { message: '권한 없음' });

                await socket.join(`group:${gid}`);
                socket.emit('joined_group', { groupId: gid });

                // Notify other users in the group (minimal data)
                io.to(`group:${gid}`).emit('group_user_joined', {
                    group_id: gid,
                    user_id: userId,
                    username: username,
                    timestamp: new Date().toISOString()
                });

                console.log(`[Socket] User ${userId} joined group ${gid}`);
            }catch(err){
                console.error('[Socket] join_group error:', err.message);
                socket.emit('error_message', { message: 'join_group 실패', error: err.message });
            }
        });

        socket.on('send_group_message', async ({ groupId, message }) => {
            const client = await pool.connect();
            try{
                const gid = Number(groupId);
                const text = (message ?? '').toString().trim();
                if(!gid || !text) return;

                const ok = await assertGroupMember(gid, userId);
                if(!ok) return socket.emit('error_message', { message: '권한 없음' });

                // OPTIMIZED: Single query to save message
                const saved = await client.query(
                    `INSERT INTO messenger.group_messages(message, user_id, group_id)
                     VALUES ($1, $2, $3)
                     RETURNING message_id, created_at`,
                    [text, userId, gid]
                );

                const payload = {
                    message_id: saved.rows[0].message_id,
                    group_id: gid,
                    user_id: userId,
                    username: username,
                    message: text,
                    created_at: saved.rows[0].created_at
                };

                // OPTIMIZED: Use batching for high-volume scenarios
                // For standard cases, emit directly to avoid latency
                io.to(`group:${gid}`).emit('group_message', payload);

                // Optional: Use batching for very high-volume
                // addToBatch(io, gid, payload);

            }catch(err){
                console.error('[Socket] send_group_message error:', err.message);
                socket.emit('error_message', { message: 'send_group_message 실패', error: err.message });
            } finally{
                client.release();
            }
        });

        socket.on('leave_group', async ({ groupId }) => {
            try{
                const gid = Number(groupId);
                if(!gid) return socket.emit('error_message', { message: 'groupId 필요' });

                const ok = await assertGroupMember(gid, userId);
                if(!ok) return socket.emit('error_message', { message: '권한 없음' });

                await socket.leave(`group:${gid}`);

                io.to(`group:${gid}`).emit('group_user_left', {
                    group_id: gid,
                    user_id: userId,
                    username: username,
                    timestamp: new Date().toISOString()
                });

                socket.emit('left_group', { groupId: gid });
                console.log(`[Socket] User ${userId} left group ${gid}`);
            }catch(err){
                console.error('[Socket] leave_group error:', err.message);
                socket.emit('error_message', { message: 'leave_group 실패', error: err.message });
            }
        });

        socket.on('get_group_users', async ({ groupId }) => {
            try{
                const gid = Number(groupId);
                if(!gid) return socket.emit('error_message', { message: 'groupId 필요' });

                const ok = await assertGroupMember(gid, userId);
                if(!ok) return socket.emit('error_message', { message: '권한 없음' });

                // Get all users in group that are currently connected
                const room = io.sockets.adapter.rooms.get(`group:${gid}`);
                const connectedUsers = [];

                if(room){
                    for(let socketId of room){
                        const s = io.sockets.sockets.get(socketId);
                        if(s?.user?.user_id){
                            connectedUsers.push({
                                user_id: s.user.user_id,
                                username: s.user.username
                            });
                        }
                    }
                }

                socket.emit('group_users', {
                    group_id: gid,
                    users: connectedUsers,
                    count: connectedUsers.length
                });
            }catch(err){
                console.error('[Socket] get_group_users error:', err.message);
                socket.emit('error_message', { message: 'get_group_users 실패', error: err.message });
            }
        });

        // Disconnect handler
        socket.on('disconnect', () => {
            console.log(`[Socket] User ${userId} (${username}) disconnected`);
            // Cleanup batch queues if needed
        });
    });
};

