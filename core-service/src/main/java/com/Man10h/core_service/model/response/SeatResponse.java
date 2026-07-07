package com.Man10h.core_service.model.response;

public record SeatResponse(
        Long id,
        String seatNumber,
        Long floor,
        Long row,
        Long col,
        String seatType,
        String status,
        boolean isVip
) {
}
