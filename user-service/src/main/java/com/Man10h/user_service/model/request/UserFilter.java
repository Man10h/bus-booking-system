package com.Man10h.user_service.model.request;

public record UserFilter(
        String keyword,
        Long roleId,
        String roleName,
        Boolean enabled,
        String gender
) {}
