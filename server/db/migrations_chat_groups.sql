-- Run this once in PostgreSQL to enable group chat functionality

-- Create groups table
CREATE TABLE IF NOT EXISTS messenger.groups (
    group_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by BIGINT NOT NULL REFERENCES messenger.user_info(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS messenger.group_members (
    group_id BIGINT NOT NULL REFERENCES messenger.groups(group_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES messenger.user_info(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    role VARCHAR(50) DEFAULT 'member',
    PRIMARY KEY (group_id, user_id)
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS messenger.group_messages (
    message_id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES messenger.groups(group_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES messenger.user_info(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON messenger.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON messenger.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON messenger.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_composite ON messenger.group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON messenger.group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON messenger.group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_user_id ON messenger.group_messages(user_id);
