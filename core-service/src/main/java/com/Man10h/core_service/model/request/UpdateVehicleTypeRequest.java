package com.Man10h.core_service.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateVehicleTypeRequest (
        @NotBlank(message = "This field is required")
        String seatType,

        @NotBlank(message = "This field is required")
        String code,

        @NotBlank(message = "This field is required")
        String name,

        @NotNull(message = "This field is required")
        Integer floors,

        @NotNull(message = "This field is required")
        Integer rows,

        @NotNull(message = "This field is required")
        Integer cols
){
}
