package com.Man10h.user_service.model.response;

public record ErrorResponse (
        String reason,
        int code,
        String message
){
}
