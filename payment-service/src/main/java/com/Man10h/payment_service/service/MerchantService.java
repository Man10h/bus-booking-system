package com.Man10h.payment_service.service;

import com.Man10h.payment_service.model.request.CreateMerchantRequest;
import com.Man10h.payment_service.model.response.MerchantResponse;

public interface MerchantService {
    public MerchantResponse createMerchant(String userId, CreateMerchantRequest request);

}
