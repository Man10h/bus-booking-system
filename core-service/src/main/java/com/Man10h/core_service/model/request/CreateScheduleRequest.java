package com.Man10h.core_service.model.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CreateScheduleRequest(
        @NotNull(message = "This field is required")
        Long routeId,

        @NotNull(message = "This field is required")
        Long vehicleId,

        @NotNull(message = "This field is required")
        LocalDateTime departureTime,

        @NotNull(message = "This field is required")
        LocalDateTime arrivalTime,

        @NotNull(message = "This field is required")
        BigDecimal basePrice,

        @NotNull(message = "This field is required")
        BigDecimal vipPrice
) {
}
