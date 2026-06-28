--liquibase formatted sql
--changeset manh:1

CREATE TABLE role (
                      id BIGINT PRIMARY KEY,
                      name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
                        id CHAR(36) PRIMARY KEY,

                        email VARCHAR(255) NOT NULL UNIQUE,
                        password VARCHAR(255) NOT NULL,

                        full_name VARCHAR(255) NOT NULL,
                        phone VARCHAR(20),
                        address VARCHAR(255),
                        avatar_url VARCHAR(500),

                        gender VARCHAR(10),

                        enabled BOOLEAN NOT NULL DEFAULT FALSE,
                        created_at DATETIME NOT NULL,

                        verification_code VARCHAR(255),
                        verification_expiry_date DATETIME,

                        role_id BIGINT NOT NULL,

                        CONSTRAINT fk_user_role
                            FOREIGN KEY (role_id)
                                REFERENCES role(id)
);