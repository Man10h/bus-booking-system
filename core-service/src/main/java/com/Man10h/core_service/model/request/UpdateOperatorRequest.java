package com.Man10h.core_service.model.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateOperatorRequest(
        @NotBlank(message = "This field is required")
        String companyName,

        @NotBlank(message = "This field is required")
        String taxCode,

        @NotBlank(message = "This field is required")
        String contactPhone,

        @NotBlank(message = "This field is required")
        String avatarUrl
) {
}
