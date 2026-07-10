package com.Man10h.payment_service.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreatePaymentRequest(
        @NotBlank
        String provider,

        @NotNull
        Long bookingId
) {
}
