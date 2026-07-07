--liquibase formatted sql
--changeset manh:2

INSERT INTO role(id, name)
VALUES
    (1, 'USER'),
    (2, 'OPERATOR'),
    (3, 'ADMIN')