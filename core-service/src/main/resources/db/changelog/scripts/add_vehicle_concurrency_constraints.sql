-- Liquibase formatted SQL
-- changeset manh:add-vehicle-concurrency-constraints
ALTER TABLE vehicle ADD CONSTRAINT uq_vehicle_license_plate UNIQUE (license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicle_license_plate ON vehicle(license_plate);
ALTER TABLE vehicle_type ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE vehicle ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
