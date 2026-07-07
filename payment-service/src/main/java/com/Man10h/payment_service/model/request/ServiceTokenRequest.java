package com.Man10h.payment_service.model.request;

import jakarta.validation.constraints.NotBlank;

public record ServiceTokenRequest(
        @NotBlank(message = "This field is required")
        String grantType,

        @NotBlank(message = "This field is required")
        String clientId,

        @NotBlank(message = "This field is required")
        String clientSecret,

        @NotBlank(message = "This field is required")
        String scope
) {}