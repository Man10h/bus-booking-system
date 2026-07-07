package com.Man10h.auth_service.controller.exception;

public class InvalidSecretException extends RuntimeException {
    public InvalidSecretException(String message) {
        super(message);
    }
}
