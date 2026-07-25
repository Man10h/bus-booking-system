package com.Man10h.core_service.model.response;

import com.Man10h.core_service.model.enums.SeatType;

public record VehicleTypeResponse (
        Long id,
        SeatType seatType,
        String code,
        String name,
        int floors,
        int rows,
        int cols
){
}
