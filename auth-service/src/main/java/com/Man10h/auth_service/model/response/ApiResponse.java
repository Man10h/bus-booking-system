package com.Man10h.auth_service.model.response;

public record ApiResponse<T> (
        T data,
        String message,
        int code
) {
}
