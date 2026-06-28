package com.Man10h.user_service.model.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record UserRegisterRequest(
        @Email(message = "This field is required")
        String email,
        @NotBlank(message = "This field is required")
        String password,
        @NotBlank(message = "This field is required")
        String rePassword,

        @NotBlank(message = "Phone field is required")
        @Pattern(
                regexp = "^(03|05|07|08|09)\\d{8}$",
                message = "Phone number is invalid"
        )
        String phone,

        @NotBlank(message = "This field is required")
        String fullName
) {
}
