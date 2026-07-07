package com.Man10h.user_service.model.response;

import java.time.LocalDateTime;

public record ErrorResponse (
        String reason,
        int code,
        String message,
        LocalDateTime createdAt
){
}
