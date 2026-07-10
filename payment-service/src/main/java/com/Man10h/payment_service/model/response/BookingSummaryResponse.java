package com.Man10h.payment_service.model.response;

import com.Man10h.payment_service.model.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingSummaryResponse(
        Long id,
        String userId,
        String operatorId,
        String bookingCode,
        BigDecimal totalAmount,
        LocalDateTime paymentDeadline,
        LocalDateTime createAt,
        BookingStatus status
){
}
