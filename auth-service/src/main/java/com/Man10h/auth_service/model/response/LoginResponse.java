package com.Man10h.auth_service.model.response;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        Long expiresIn,
        Long refreshTokenExpiresIn
) {
}
