package com.Man10h.payment_service.service;

import com.Man10h.payment_service.model.entities.Payment;
import com.Man10h.payment_service.model.request.CreatePaymentRequest;

public interface VNPayService {
    public String createPaymentUrl(Payment payment);
}
