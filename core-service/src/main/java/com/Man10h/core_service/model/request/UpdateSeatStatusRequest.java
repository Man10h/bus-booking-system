package com.Man10h.core_service.model.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateSeatStatusRequest(
        @NotBlank(message = "This field is required")
        String status
) {
}
