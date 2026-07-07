package com.Man10h.core_service.model.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateRouteStopRequest (
        @NotNull(message = "This field is required")
        Long stopOrder,

        @NotBlank(message = "This field is required")
        String stopName,

        @NotNull(message = "This field is required")
        BigDecimal distanceFromStart,

        @NotNull(message = "This field is required")
        Long estimatedArrivalOffsetMinutes,

        @NotEmpty(message = "This field is required")
        Boolean isPickup,

        @NotEmpty(message = "This field is required")
        Boolean isDropOff,

        @NotNull(message = "This field is required")
        Long cityId
){
}
