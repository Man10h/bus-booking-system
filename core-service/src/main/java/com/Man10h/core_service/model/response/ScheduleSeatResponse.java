package com.Man10h.core_service.model.response;
import com.Man10h.core_service.model.enums.ScheduleSeatStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ScheduleSeatResponse(
        Long id,
        BigDecimal price,
        String heldBy,
        LocalDateTime heldAt,
        LocalDateTime expiresAt,
        ScheduleSeatStatus status,
        SeatResponse seatResponse
) {
}
