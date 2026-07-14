package com.Man10h.core_service.model.response;

import java.math.BigDecimal;

public record TopVehicleResponse(
        Long vehicleId,
        String licensePlate,
        BigDecimal revenue
) {}