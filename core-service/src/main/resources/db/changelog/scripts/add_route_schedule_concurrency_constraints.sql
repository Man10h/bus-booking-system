--liquibase formatted sql
--changeset manhc:add_route_schedule_concurrency_constraints

-- 1. Enable btree_gist extension for PostgreSQL exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Clean up existing overlapping seed schedules before adding constraint
UPDATE schedule s
SET status = 'CANCELLED'
WHERE s.id NOT IN (
    SELECT MIN(id)
    FROM schedule
    WHERE status <> 'CANCELLED'
    GROUP BY vehicle_id, tsrange(departure_time, arrival_time)
)
AND status <> 'CANCELLED';

-- 3. Prevent overlapping schedules for the same vehicle (Exclusion Constraint)
ALTER TABLE schedule 
ADD CONSTRAINT no_overlapping_vehicle_schedule 
EXCLUDE USING gist (
    vehicle_id WITH =,
    tsrange(departure_time, arrival_time) WITH &&
) 
WHERE (status <> 'CANCELLED');
