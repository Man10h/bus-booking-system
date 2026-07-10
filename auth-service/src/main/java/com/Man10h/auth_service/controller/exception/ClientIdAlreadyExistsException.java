package com.Man10h.auth_service.controller.exception;

public class ClientIdAlreadyExistsException extends RuntimeException {
    public ClientIdAlreadyExistsException(String message) {
        super(message);
    }
}
