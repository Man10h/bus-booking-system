package com.Man10h.payment_service.controller.exceptions;

public class MerchantNotFound extends RuntimeException {
    public MerchantNotFound(String message) {
        super(message);
    }
}
