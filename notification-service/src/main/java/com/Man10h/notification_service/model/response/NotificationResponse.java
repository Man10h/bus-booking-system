package com.Man10h.notification_service.model.response;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String userId,
        String content,
        Boolean isRead,
        LocalDateTime createdAt,
        String targetCode
) {
}
