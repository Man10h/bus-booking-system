package com.Man10h.payment_service.model.request;

import jakarta.validation.constraints.NotBlank;

public record CreateMerchantRequest(
    @NotBlank(message = "This field is required")
    String provider,
    @NotBlank(message = "This field is required")
    String merchantCode,
    @NotBlank(message = "This field is required")
    String secretKey
) {
}
