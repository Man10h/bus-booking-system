package com.Man10h.core_service.model.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateBookingRequest(
        @NotNull
        Long scheduleId,
        @NotEmpty
        List<Long> scheduleSeatIds
) {
}
