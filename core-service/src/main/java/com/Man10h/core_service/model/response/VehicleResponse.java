package com.Man10h.core_service.model.response;

public record VehicleResponse(
        Long id,
        String licensePlate,
        String brand,
        String model,
        Long totalSeats,
        String description,
        VehicleTypeResponse vehicleType,
        OperatorResponse operatorResponse
) {
}
