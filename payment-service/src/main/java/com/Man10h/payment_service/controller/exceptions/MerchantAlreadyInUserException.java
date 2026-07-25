package com.Man10h.payment_service.controller.exceptions;

public class MerchantAlreadyInUserException extends RuntimeException {
    public MerchantAlreadyInUserException(String message) {
        super(message);
    }
}
