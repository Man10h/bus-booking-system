package com.Man10h.auth_service.controller.exception;

public class ServiceClientNotFoundException extends RuntimeException {
    public ServiceClientNotFoundException(String message) {
        super(message);
    }
}
