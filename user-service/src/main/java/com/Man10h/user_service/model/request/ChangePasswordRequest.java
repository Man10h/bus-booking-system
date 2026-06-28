package com.Man10h.user_service.model.request;

import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(
        @NotBlank(message = "This field is required")
        String oldPassword,

        @NotBlank(message = "This field is required")
        String newPassword,

        @NotBlank(message = "This field is required")
        String confirmPassword
) {
}
