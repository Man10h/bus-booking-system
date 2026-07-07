package com.Man10h.core_service.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record CreateVehicleRequest(
        @NotBlank(message = "This field is required")
        String licensePlate,

        @NotBlank(message = "This field is required")
        String brand,

        @NotBlank(message = "This field is required")
        String model,

        @NotNull(message = "This field is required")
        Long totalSeats,

        @NotBlank(message = "This field is required")
        String description,

        @NotNull(message = "This field is required")
        Long vehicleTypeId
) {
}
