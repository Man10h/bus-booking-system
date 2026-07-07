package com.Man10h.core_service.model.request;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CreateScheduleRequest(
        Long routeId,
        Long vehicleId,
        LocalDateTime departureTime,
        LocalDateTime arrivalTime,
        BigDecimal basePrice,
        BigDecimal vipPrice
) {
}
