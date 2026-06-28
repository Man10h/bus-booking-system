package com.Man10h.user_service.model.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

public record UserLoginRequest(
        @Email(message = "This field is required")
        String email,
        @NotNull(message = "This field is required")
        String password
) {
}
