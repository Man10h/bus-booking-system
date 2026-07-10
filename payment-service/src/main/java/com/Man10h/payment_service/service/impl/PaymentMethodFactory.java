package com.Man10h.payment_service.service.impl;


import com.Man10h.payment_service.model.enums.Provider;
import com.Man10h.payment_service.service.PaymentMethod;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class PaymentMethodFactory {
    private final Map<Provider, PaymentMethod> paymentMethods;

    public PaymentMethodFactory(List<PaymentMethod> paymentMethods) {
        this.paymentMethods = paymentMethods.stream()
                .collect(Collectors.toMap(
                        PaymentMethod::getProvider,
                        Function.identity()
                ));
    }

    public PaymentMethod getPaymentMethod(Provider provider) {
        return Optional.ofNullable(paymentMethods.get(provider))
                .orElseThrow(() -> new IllegalArgumentException("Unsupported provider: " + provider));
    }
}
