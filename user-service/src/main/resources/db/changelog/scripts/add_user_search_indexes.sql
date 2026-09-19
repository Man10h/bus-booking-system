--liquibase formatted sql
--changeset manh:4

CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_enabled_created_at ON users(enabled, created_at DESC);
CREATE INDEX idx_users_role_enabled ON users(role_id, enabled);
CREATE INDEX idx_users_phone ON users(phone);
