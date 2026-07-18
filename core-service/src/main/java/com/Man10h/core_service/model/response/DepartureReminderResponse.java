package com.Man10h.core_service.model.response;

public record DepartureReminderResponse(
        Long bookingId,
        String userId,
        String bookingCode
) {
}
