--liquibase formatted sql
--changeset manh:6

-- Route search indexes
CREATE INDEX idx_route_cities_status ON route(departure_city_id, arrival_city_id, status);
CREATE INDEX idx_route_operator_status ON route(operator_id, status);

-- Schedule search indexes
CREATE INDEX idx_schedule_route_dep_status ON schedule(route_id, departure_time, status);
CREATE INDEX idx_schedule_dep_status ON schedule(departure_time, status);
CREATE INDEX idx_schedule_operator_dep ON schedule(operator_id, departure_time);
