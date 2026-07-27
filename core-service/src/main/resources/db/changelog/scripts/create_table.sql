--liquibase formatted sql
--changeset manhc:2

CREATE TABLE city (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    code VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE operator (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    tax_code VARCHAR(100) NOT NULL UNIQUE,
    contact_phone VARCHAR(50),
    avatar_url VARCHAR(500)
);

CREATE TABLE vehicle_type (
    id BIGSERIAL PRIMARY KEY,
    seat_type VARCHAR(50),
    code VARCHAR(100),
    name VARCHAR(255),
    floors INT NOT NULL CHECK (floors > 0),
    "rows" INT NOT NULL CHECK ("rows" > 0),
    cols INT NOT NULL CHECK (cols > 0)
);

CREATE TABLE vehicle (
    id BIGSERIAL PRIMARY KEY,
    license_plate VARCHAR(50),
    brand VARCHAR(100),
    model VARCHAR(100),
    total_seats BIGINT CHECK (total_seats >= 0),
    description VARCHAR(500),
    status VARCHAR(50),
    operator_id VARCHAR(36),
    vehicle_type_id BIGINT,
    CONSTRAINT fk_vehicle_operator FOREIGN KEY (operator_id) REFERENCES operator(id) ON DELETE CASCADE,
    CONSTRAINT fk_vehicle_type FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_type(id) ON DELETE RESTRICT
);

CREATE TABLE seat (
    id BIGSERIAL PRIMARY KEY,
    seat_number VARCHAR(50),
    floor BIGINT CHECK (floor > 0),
    "row" BIGINT CHECK ("row" > 0),
    col BIGINT CHECK (col > 0),
    is_vip BOOLEAN DEFAULT FALSE,
    seat_type VARCHAR(50),
    status VARCHAR(50),
    vehicle_id BIGINT,
    CONSTRAINT fk_seat_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id) ON DELETE CASCADE,
    CONSTRAINT uq_seat_number_vehicle UNIQUE (vehicle_id, seat_number)
);

CREATE TABLE route (
    id BIGSERIAL PRIMARY KEY,
    route_code VARCHAR(100) NOT NULL UNIQUE,
    distance DECIMAL(10, 2) CHECK (distance >= 0),
    estimated_duration_minutes BIGINT CHECK (estimated_duration_minutes > 0),
    status VARCHAR(50),
    operator_id VARCHAR(36),
    departure_city_id BIGINT,
    arrival_city_id BIGINT,
    CONSTRAINT fk_route_operator FOREIGN KEY (operator_id) REFERENCES operator(id) ON DELETE CASCADE,
    CONSTRAINT fk_route_departure_city FOREIGN KEY (departure_city_id) REFERENCES city(id) ON DELETE RESTRICT,
    CONSTRAINT fk_route_arrival_city FOREIGN KEY (arrival_city_id) REFERENCES city(id) ON DELETE RESTRICT
);

CREATE TABLE route_stop (
    id BIGSERIAL PRIMARY KEY,
    stop_order BIGINT CHECK (stop_order >= 1),
    stop_name VARCHAR(255),
    distance_from_start DECIMAL(10, 2) CHECK (distance_from_start >= 0),
    estimated_arrival_offset_minutes BIGINT CHECK (estimated_arrival_offset_minutes >= 0),
    is_pickup BOOLEAN DEFAULT FALSE,
    is_drop_off BOOLEAN DEFAULT FALSE,
    route_id BIGINT,
    city_id BIGINT,
    CONSTRAINT fk_route_stop_route FOREIGN KEY (route_id) REFERENCES route(id) ON DELETE CASCADE,
    CONSTRAINT fk_route_stop_city FOREIGN KEY (city_id) REFERENCES city(id) ON DELETE RESTRICT,
    CONSTRAINT uq_route_stop_order UNIQUE (route_id, stop_order)
);

CREATE TABLE schedule (
    id BIGSERIAL PRIMARY KEY,
    departure_time TIMESTAMP WITHOUT TIME ZONE,
    arrival_time TIMESTAMP WITHOUT TIME ZONE,
    base_price DECIMAL(10, 2) CHECK (base_price >= 0),
    vip_price DECIMAL(10, 2) CHECK (vip_price >= 0),
    available_seats BIGINT CHECK (available_seats >= 0),
    total_seats BIGINT CHECK (total_seats >= 0),
    operator_id VARCHAR(36) NOT NULL,
    status VARCHAR(50),
    route_id BIGINT,
    vehicle_id BIGINT,
    CONSTRAINT fk_schedule_route FOREIGN KEY (route_id) REFERENCES route(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id) ON DELETE RESTRICT,
    CONSTRAINT chk_schedule_times CHECK (arrival_time > departure_time)
);

CREATE TABLE booking (
    id BIGSERIAL PRIMARY KEY,
    booking_code VARCHAR(100) NOT NULL UNIQUE,
    user_id VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) CHECK (total_amount >= 0),
    payment_deadline TIMESTAMP WITHOUT TIME ZONE,
    create_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    operator_id VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    notified BOOLEAN DEFAULT FALSE,
    schedule_id BIGINT,
    CONSTRAINT fk_booking_schedule FOREIGN KEY (schedule_id) REFERENCES schedule(id) ON DELETE CASCADE
);

CREATE TABLE schedule_seat (
    id BIGSERIAL PRIMARY KEY,
    price DECIMAL(10, 2) CHECK (price >= 0),
    status VARCHAR(50),
    held_by VARCHAR(255),
    held_at TIMESTAMP WITHOUT TIME ZONE,
    expired_at TIMESTAMP WITHOUT TIME ZONE,
    booking_id BIGINT,
    schedule_id BIGINT,
    seat_id BIGINT,
    CONSTRAINT fk_schedule_seat_booking FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE SET NULL,
    CONSTRAINT fk_schedule_seat_schedule FOREIGN KEY (schedule_id) REFERENCES schedule(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_seat_seat FOREIGN KEY (seat_id) REFERENCES seat(id) ON DELETE CASCADE,
    CONSTRAINT uq_schedule_seat UNIQUE (schedule_id, seat_id)
);
