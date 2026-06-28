package com.Man10h.user_service.model.response;

import java.time.LocalDateTime;

public record UserResponse (
        String id,
        String email,
        String phone,
        String fullName,
        String address,
        String gender,
        String avatarUrl,
        boolean enabled,
        LocalDateTime createdAt,
        String role
){
}
