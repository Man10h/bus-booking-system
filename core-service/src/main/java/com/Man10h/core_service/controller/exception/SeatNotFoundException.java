package com.Man10h.core_service.controller.exception;

public class SeatNotFoundException extends RuntimeException
{
    public SeatNotFoundException(String message) {
        super(message);
    }
}
