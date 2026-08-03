package com.Man10h.core_service.model.response;

import com.Man10h.core_service.model.enums.ScheduleStatus;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ScheduleSummaryResponse(
        Long id,
        String operatorId,
        LocalDateTime departureTime,
        LocalDateTime arrivalTime,
        BigDecimal basePrice,
        BigDecimal vipPrice,
        Long availableSeats,
        ScheduleStatus status,
        Long totalSeats,
        String departureCityName,
        String arrivalCityName
)implements Serializable {
}
