package com.Man10h.core_service.controller.exception;

public class VehicleTypeAlreadyInUseException extends RuntimeException {
    public VehicleTypeAlreadyInUseException(String message) {
        super(message);
    }
}
