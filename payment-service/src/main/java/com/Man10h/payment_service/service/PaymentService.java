package com.Man10h.payment_service.service;

import com.Man10h.payment_service.model.request.CreatePaymentRequest;
import com.Man10h.payment_service.model.response.PaymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface PaymentService {
    public String createPayment(String userId, CreatePaymentRequest createPaymentRequest);
    public Page<PaymentResponse> getUserPayments(String userId, Pageable pageable);

}
