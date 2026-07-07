package com.Man10h.payment_service.service.impl;

import com.Man10h.payment_service.model.request.CreatePaymentRequest;
import com.Man10h.payment_service.service.PaymentService;
import com.Man10h.payment_service.service.VNPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {
    private final VNPayService vnPayService;

    @Override
    public String createPayment(String userId, CreatePaymentRequest createPaymentRequest) {
        return "";
    }
}
