package com.Man10h.user_service.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UserUpdateRequest (
        @NotBlank(message = "This field is required")
        String fullName,

        @NotBlank(message = "Phone field is required")
        @Pattern(
                regexp = "^(03|05|07|08|09)\\d{8}$",
                message = "Phone number is invalid"
        )
        String phone,

        @NotBlank(message = "This field is required")
        String address,

        @NotBlank(message = "This field is required")
        String avatarUrl,

        @NotBlank(message = "This field is required")
        String gender
){
}
