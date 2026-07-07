package com.Man10h.auth_service.model.request;

import jakarta.validation.constraints.NotBlank;

public record ServiceClientRequest (
        @NotBlank(message = "This field is required")
        String clientId,
        @NotBlank(message = "This field is required")
        String clientSecret,
        @NotBlank(message = "This field is required")
        String scope
){
}
