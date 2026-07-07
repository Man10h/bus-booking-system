package com.Man10h.payment_service.service.impl;

import com.Man10h.payment_service.model.entities.Merchant;
import com.Man10h.payment_service.model.enums.Provider;
import com.Man10h.payment_service.model.request.CreateMerchantRequest;
import com.Man10h.payment_service.model.request.ServiceTokenRequest;
import com.Man10h.payment_service.model.response.ApiResponse;
import com.Man10h.payment_service.model.response.MerchantResponse;
import com.Man10h.payment_service.model.response.OperatorResponse;
import com.Man10h.payment_service.repository.MerchantRepository;
import com.Man10h.payment_service.service.AuthService;
import com.Man10h.payment_service.service.CoreService;
import com.Man10h.payment_service.service.MerchantService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class MerchantServiceImpl implements MerchantService {

    private final MerchantRepository merchantRepository;
    @Value("${services.payment.clientId}")
    private String clientId;

    @Value("${services.payment.clientSecret}")
    private String clientSecret;

    @Value("${services.payment.scope}")
    private String scope;

    private final AuthService authService;
    private final CoreService coreService;

    @Transactional
    public MerchantResponse createMerchant(String userId, CreateMerchantRequest request) {
        ServiceTokenRequest serviceTokenRequest = new ServiceTokenRequest("client_credentials",clientId, clientSecret, scope);

        ResponseEntity<ApiResponse<String>> tokenResponse = authService.serviceToken(serviceTokenRequest);
        if(tokenResponse.getStatusCode().is2xxSuccessful()) {
            String token = Objects.requireNonNull(tokenResponse.getBody()).data();

            ResponseEntity<ApiResponse<OperatorResponse>> operatorResponse = coreService.getOperatorByUserId(userId, token);
            if(operatorResponse.getStatusCode().is2xxSuccessful()) {
                String operatorId = Objects.requireNonNull(operatorResponse.getBody()).data().id();
                Merchant merchant = Merchant.builder()
                        .operatorId(operatorId)
                        .merchantCode(request.merchantCode())
                        .provider(Provider.valueOf(request.provider()))
                        .secretKey(request.secretKey())
                        .payments(new ArrayList<>())
                        .createdAt(LocalDateTime.now())
                        .active(Boolean.TRUE)
                        .build();

                merchantRepository.save(merchant);
                return new MerchantResponse(
                        merchant.getId(),
                        merchant.getOperatorId(),
                        merchant.getProvider().toString(),
                        merchant.getMerchantCode(),
                        merchant.getSecretKey(),
                        merchant.getActive(),
                        merchant.getCreatedAt()
                );
            }
        }
        return null;
    }
}
