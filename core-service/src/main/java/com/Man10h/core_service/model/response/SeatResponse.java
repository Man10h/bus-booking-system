package com.Man10h.core_service.model.response;

import com.Man10h.core_service.model.enums.SeatStatus;

public record SeatResponse(
        Long id,
        String seatNumber,
        Long floor,
        Long row,
        Long col,
        String seatType,
        SeatStatus status,
        boolean isVip
) {
}
