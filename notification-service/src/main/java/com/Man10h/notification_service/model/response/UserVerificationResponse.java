package com.Man10h.notification_service.model.response;

import java.time.LocalDateTime;

public record UserVerificationResponse(
        String email,
        Boolean enabled,
        LocalDateTime createdAt,
        String verificationCode,
        LocalDateTime verificationExpiryDate
) {
}
