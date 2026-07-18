package com.Man10h.notification_service.model.response;

import java.time.LocalDateTime;

public record ErrorResponse(
        String reason,
        int code,
        String message,
        LocalDateTime createdAt
) {
}
