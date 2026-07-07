package com.Man10h.payment_service.model.response;

import java.time.LocalDateTime;

public record MerchantResponse(
    String id,
    String operatorId,
    String provider,
    String merchantCode,
    String secretKey,
    Boolean active,
    LocalDateTime createAt
) {
}
