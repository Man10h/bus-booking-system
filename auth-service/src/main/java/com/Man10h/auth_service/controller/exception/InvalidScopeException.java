package com.Man10h.auth_service.controller.exception;

public class InvalidScopeException extends RuntimeException {
    public InvalidScopeException(String message) {
        super(message);
    }
}
