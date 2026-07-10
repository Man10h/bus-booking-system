package com.Man10h.payment_service.controller.exceptions;

public class MerchantInActiveException extends RuntimeException {
    public MerchantInActiveException(String message) {
        super(message);
    }
}
