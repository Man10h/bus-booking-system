-- Liquibase formatted SQL
-- changeset manh:add-route-version-columns
ALTER TABLE route ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE route_stop ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
