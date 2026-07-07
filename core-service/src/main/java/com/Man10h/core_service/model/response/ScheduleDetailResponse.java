package com.Man10h.core_service.model.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ScheduleDetailResponse (
        Long id,
        LocalDateTime departureTime,
        LocalDateTime arrivalTime,
        BigDecimal basePrice,
        BigDecimal vipPrice,
        Long availableSeats,
        Long totalSeats,
        String status,
        VehicleResponse vehicleResponse,
        RouteDetailResponse routeDetailResponse
){
}
