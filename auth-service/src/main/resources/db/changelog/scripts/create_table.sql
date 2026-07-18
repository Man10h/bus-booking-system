--liquibase formatted sql
--changeset manh:3

CREATE TABLE refresh_token (
                               id BIGINT AUTO_INCREMENT PRIMARY KEY,
                               token VARCHAR(1024) NOT NULL,
                               user_id VARCHAR(255) NOT NULL,
                               expires_at DATETIME NOT NULL,
                               revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE service_client (
                                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                client_id VARCHAR(100) NOT NULL UNIQUE,
                                client_secret VARCHAR(255) NOT NULL,
                                scopes VARCHAR(500) NOT NULL,
                                active BOOLEAN NOT NULL DEFAULT TRUE
);