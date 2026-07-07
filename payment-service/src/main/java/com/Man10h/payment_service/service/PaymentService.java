package com.Man10h.payment_service.service;

import com.Man10h.payment_service.model.request.CreatePaymentRequest;

public interface PaymentService {
    public String createPayment(String userId, CreatePaymentRequest createPaymentRequest);
}
