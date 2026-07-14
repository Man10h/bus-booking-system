package com.Man10h.core_service.model.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record TimeStatisticResponse(
        String label,
        BigDecimal revenue
) {
}
