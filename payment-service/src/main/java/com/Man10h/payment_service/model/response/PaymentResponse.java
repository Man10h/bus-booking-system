package com.Man10h.payment_service.model.response;

import com.Man10h.payment_service.model.enums.PaymentStatus;
import com.Man10h.payment_service.model.enums.Provider;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        String id,
        String userId,
        BigDecimal amount,
        PaymentStatus status,
        Provider provider,
        String transactionId,
        String txnRef,
        LocalDateTime createdAt,
        LocalDateTime paidAt,
        Long bookingId
) {
}
