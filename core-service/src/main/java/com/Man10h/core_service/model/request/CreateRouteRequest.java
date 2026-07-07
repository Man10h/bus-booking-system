package com.Man10h.core_service.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CreateRouteRequest (
        @NotBlank(message = "This field is required")
        String routeCode,

        @NotNull(message = "This field is required")
        Long departureCityId,

        @NotNull(message = "This field is required")
        Long arrivalCityId,

        @NotNull(message = "This field is required")
        BigDecimal distance,

        @NotNull(message = "This field is required")
        Long estimatedDurationMinutes,

        @NotEmpty(message = "Route stop is required")
        List<CreateRouteStopRequest> routeStops
){
}
