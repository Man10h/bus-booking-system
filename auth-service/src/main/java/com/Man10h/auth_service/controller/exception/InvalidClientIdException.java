package com.Man10h.auth_service.controller.exception;

public class InvalidClientIdException extends RuntimeException {
    public InvalidClientIdException(String message) {
        super(message);
    }
}
