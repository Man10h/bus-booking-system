package com.Man10h.core_service.model.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingSummaryResponse (
        Long id,
        String bookingCode,
        BigDecimal totalAmount,
        LocalDateTime paymentDeadline,
        LocalDateTime createAt,
        String status
){
}
