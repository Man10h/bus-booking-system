package com.Man10h.core_service.model.request;

import java.time.LocalDateTime;

public record ScheduleFilter (
        String operatorId,
        Long routeId,
        Long departureCityId,
        Long arrivalCityId,
        LocalDateTime departureTime,
        LocalDateTime arrivalTime,
        Long vehicleTypeId,
        String status
){
}
