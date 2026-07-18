package com.Man10h.user_service.model.response;

import java.time.LocalDateTime;

public record UserVerificationResponse(
        String email,
        Boolean enabled,
        LocalDateTime createdAt,
        String verificationCode,
        LocalDateTime verificationExpiryDate
) {
}
