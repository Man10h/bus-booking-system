--liquibase formatted sql
--changeset manh:7

-- Booking indexes
CREATE INDEX IF NOT EXISTS idx_booking_user_status ON booking(user_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_schedule ON booking(schedule_id);
CREATE INDEX IF NOT EXISTS idx_booking_deadline_status ON booking(payment_deadline, status);

-- Schedule seat indexes
CREATE INDEX IF NOT EXISTS idx_schedule_seat_sched_id ON schedule_seat(schedule_id, id);
CREATE INDEX IF NOT EXISTS idx_schedule_seat_booking ON schedule_seat(booking_id);
CREATE INDEX IF NOT EXISTS idx_schedule_seat_sched_status ON schedule_seat(schedule_id, status);
