--liquibase formatted sql
--changeset manh:3

CREATE TABLE refresh_token (
                               id BIGINT AUTO_INCREMENT PRIMARY KEY,
                               token VARCHAR(1024) NOT NULL,
                               user_id VARCHAR(512) NOT NULL,
                               expires_at DATETIME NOT NULL,
                               revoked BOOLEAN NOT NULL DEFAULT FALSE
);