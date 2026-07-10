package com.Man10h.payment_service.service;

import com.Man10h.payment_service.model.entities.Payment;
import com.Man10h.payment_service.model.enums.Provider;

import java.util.Map;

public interface PaymentMethod {
    Provider getProvider();

    String createPaymentUrl(Payment payment);

    void processIpn(Map<String, String> params);
}
