package com.Man10h.core_service.model.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingDetailResponse (
        Long id,
        String bookingCode,
        BigDecimal totalAmount,
        LocalDateTime paymentDeadline,
        LocalDateTime createAt,
        String status,
        ScheduleSummaryResponse scheduleSummaryResponse,
        List<ScheduleSeatResponse> scheduleSeatResponseList
){
}
