package com.Man10h.core_service.model.response;

import com.Man10h.core_service.model.enums.VehicleStatus;

public record VehicleResponse(
        Long id,
        String licensePlate,
        String brand,
        String model,
        Long totalSeats,
        String description,
        VehicleStatus status,
        VehicleTypeResponse vehicleType,
        OperatorResponse operatorResponse
) {
}
