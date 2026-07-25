package com.Man10h.payment_service.service;

import com.Man10h.payment_service.model.entities.Merchant;
import com.Man10h.payment_service.model.request.CreateMerchantRequest;
import com.Man10h.payment_service.model.request.UpdateMerchantRequest;
import com.Man10h.payment_service.model.response.MerchantResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MerchantService {
    public MerchantResponse createMerchant(String userId, CreateMerchantRequest request);
    public MerchantResponse updateMerchant(String id, String userId, UpdateMerchantRequest request);
    public MerchantResponse getMerchantById(String id, String userId);
    public Page<MerchantResponse> getOperatorMerchant(String userId, Pageable pageable);
}
