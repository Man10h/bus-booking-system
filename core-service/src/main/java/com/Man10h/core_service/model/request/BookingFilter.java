package com.Man10h.core_service.model.request;

import java.time.LocalDateTime;

public record BookingFilter(
        String operatorId,
        LocalDateTime departureTime,
        LocalDateTime arrivalTime
) {
}
