package com.Man10h.user_service.model.response;

public record ApiResponse<T> (
        T data,
        String message,
        int code
) {
}
