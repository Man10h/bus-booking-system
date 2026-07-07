package com.Man10h.core_service.model.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ScheduleSummaryResponse(
        Long id,
        LocalDateTime departureTime,
        LocalDateTime arrivalTime,
        BigDecimal basePrice,
        BigDecimal vipPrice,
        Long availableSeats,
        String status,
        Long totalSeats
) {
}
