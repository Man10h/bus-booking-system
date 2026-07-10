package com.Man10h.payment_service.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateMerchantRequest(
        @NotBlank(message = "This field is required")
        String merchantCode,

        @NotBlank(message = "This field is required")
        String secretKey,

        @NotNull(message = "This field is required")
        boolean active
) {
}
