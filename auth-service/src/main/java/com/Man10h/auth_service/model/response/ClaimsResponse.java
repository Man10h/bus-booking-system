package com.Man10h.auth_service.model.response;

import java.util.List;

public record ClaimsResponse(
        String userId,
//        String email,
        List<String> roles,
        List<String> scopes
) {
}
