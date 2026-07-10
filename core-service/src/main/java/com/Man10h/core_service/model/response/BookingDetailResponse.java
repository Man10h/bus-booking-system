package com.Man10h.core_service.model.response;

import com.Man10h.core_service.model.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingDetailResponse (
        Long id,
        String userId,
        String operatorId,
        String bookingCode,
        BigDecimal totalAmount,
        LocalDateTime paymentDeadline,
        LocalDateTime createAt,
        BookingStatus status,
        ScheduleSummaryResponse scheduleSummaryResponse,
        List<ScheduleSeatResponse> scheduleSeatResponseList
){
}
