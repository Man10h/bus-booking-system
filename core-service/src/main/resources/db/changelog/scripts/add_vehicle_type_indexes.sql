--liquibase formatted sql
--changeset manh:5

CREATE INDEX idx_vehicle_type_code ON vehicle_type(code);
CREATE INDEX idx_vehicle_type_name ON vehicle_type(name);
CREATE INDEX idx_vehicle_type_seat_type ON vehicle_type(seat_type);
CREATE INDEX idx_vehicle_type_floors ON vehicle_type(floors);
CREATE INDEX idx_vehicle_type_composite ON vehicle_type(seat_type, floors);
