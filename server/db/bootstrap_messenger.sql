-- Bootstrap schema + tables for this project (PostgreSQL).
-- Run this in the SAME database as server/.env PG_DATABASE (currently: postgres).

CREATE SCHEMA IF NOT EXISTS messenger;

CREATE TABLE IF NOT EXISTS messenger.user_info(
	user_id BIGSERIAL primary key,
	username varchar(16) not null,
	password varchar(60) not null,
	email varchar(60) not null unique,
	profile TEXT not null,
	refresh_token TEXT,
	created_at TIMESTAMP default NOW()
);

CREATE TABLE IF NOT EXISTS messenger.login_attempts(
	ip varchar(45) primary key,
	count INT default 0,
	lock_until TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messenger.friend (
    friend_count BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES messenger.user_info(user_id),
    friend_id    BIGINT NOT NULL REFERENCES messenger.user_info(user_id),
    added_time   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messenger.email_verify (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(60) NOT NULL UNIQUE,
    code       VARCHAR(6)  NOT NULL,
    expired_at TIMESTAMP   NOT NULL,
    verified   BOOLEAN     DEFAULT FALSE,
    created_at TIMESTAMP   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messenger.room(
	room_id BIGSERIAL primary key,
	type varchar(10) not null,
	title varchar(50),
	created_at TIMESTAMP default now()
);

CREATE TABLE IF NOT EXISTS messenger.message(
	message_id BIGSERIAL primary key,
	message TEXT not null,
	created_at TIMESTAMP default now(),
	user_id BIGINT not null REFERENCES messenger.user_info(user_id),
	room_id BIGINT not null REFERENCES messenger.room(room_id)
);

CREATE TABLE IF NOT EXISTS messenger.read_check(
	read_id BIGSERIAL primary key,
	user_id BIGINT not null REFERENCES messenger.user_info(user_id),
	message_id BIGINT not null REFERENCES messenger.message(message_id)
);

-- Chat needs membership info (not present in original schema)
CREATE TABLE IF NOT EXISTS messenger.room_member (
    room_id BIGINT NOT NULL REFERENCES messenger.room(room_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES messenger.user_info(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

-- Prevent duplicate read receipt rows
CREATE UNIQUE INDEX IF NOT EXISTS read_check_user_message_idx
    ON messenger.read_check(user_id, message_id);

