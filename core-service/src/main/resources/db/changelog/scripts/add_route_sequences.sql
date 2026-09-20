--liquibase formatted sql
--changeset manhc:add_route_sequences

ALTER SEQUENCE route_id_seq INCREMENT BY 50 RESTART WITH 50000;
ALTER SEQUENCE route_stop_id_seq INCREMENT BY 50 RESTART WITH 50000;
