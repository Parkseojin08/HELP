-- Run this once in PostgreSQL to enable chat membership + sane read receipts.

CREATE TABLE IF NOT EXISTS messenger.room_member (
    room_id BIGINT NOT NULL REFERENCES messenger.room(room_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES messenger.user_info(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

-- Prevent duplicate read receipt rows
CREATE UNIQUE INDEX IF NOT EXISTS read_check_user_message_idx
    ON messenger.read_check(user_id, message_id);

