package com.Man10h.auth_service.model.request;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
        @NotBlank(message = "This field is not blank")
        String refreshToken
) {
}
