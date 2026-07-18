package com.Man10h.notification_service.model.response;

public record DepartureReminderResponse(
        Long bookingId,
        String userId,
        String bookingCode
) {
}
