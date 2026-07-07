package com.Man10h.payment_service.model.request;

public record CreateMerchantRequest(
    String provider,
    String merchantCode,
    String secretKey
) {
}
