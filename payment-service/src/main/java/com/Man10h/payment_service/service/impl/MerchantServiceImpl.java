package com.Man10h.payment_service.service.impl;

import com.Man10h.payment_service.controller.exceptions.*;
import com.Man10h.payment_service.model.entities.Merchant;
import com.Man10h.payment_service.model.enums.PaymentStatus;
import com.Man10h.payment_service.model.enums.Provider;
import com.Man10h.payment_service.model.request.CreateMerchantRequest;
import com.Man10h.payment_service.model.request.ServiceTokenRequest;
import com.Man10h.payment_service.model.request.UpdateMerchantRequest;
import com.Man10h.payment_service.model.response.ApiResponse;
import com.Man10h.payment_service.model.response.MerchantResponse;
import com.Man10h.payment_service.model.response.OperatorResponse;
import com.Man10h.payment_service.repository.MerchantRepository;
import com.Man10h.payment_service.repository.PaymentRepository;
import com.Man10h.payment_service.service.AuthService;
import com.Man10h.payment_service.service.CoreService;
import com.Man10h.payment_service.service.MerchantService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MerchantServiceImpl implements MerchantService {

    private final MerchantRepository merchantRepository;
    private final PaymentRepository paymentRepository;
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

            ResponseEntity<ApiResponse<OperatorResponse>> operatorResponse = coreService.getOperatorByUserId(userId, "Bearer " + token);
            if(operatorResponse.getStatusCode().is2xxSuccessful()) {
                String operatorId = Objects.requireNonNull(operatorResponse.getBody()).data().id();


                if(merchantRepository.existsByProviderAndOperatorId(Provider.valueOf(request.provider()), operatorId)
                || merchantRepository.existsByMerchantCode(request.merchantCode())) {
                    throw new MerchantAlreadyExistsException("Merchant already exists");
                }


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

    @Transactional
    public MerchantResponse updateMerchant(String id, String userId, UpdateMerchantRequest request) {
        Optional<Merchant> optional = merchantRepository.findById(id);
        if(optional.isEmpty()) {
            throw new MerchantNotFound("Merchant not found");
        }
        Merchant merchant = optional.get();
        ServiceTokenRequest serviceTokenRequest = new ServiceTokenRequest("client_credentials",clientId, clientSecret, scope);
        ResponseEntity<ApiResponse<String>> tokenResponse = authService.serviceToken(serviceTokenRequest);
        if(tokenResponse.getStatusCode().is2xxSuccessful()) {
            String token = Objects.requireNonNull(tokenResponse.getBody()).data();

            ResponseEntity<ApiResponse<OperatorResponse>> operatorResponse = coreService.getOperatorByUserId(userId, "Bearer " + token);
            if(operatorResponse.getStatusCode().is2xxSuccessful()) {
                String operatorId = Objects.requireNonNull(operatorResponse.getBody()).data().id();
                if(!merchant.getOperatorId().equals(operatorId)) {
                    throw new InvalidAccessException("You do not own this merchant");
                }
                if(paymentRepository.existsByStatusAndMerchant_Id(PaymentStatus.PENDING, id)){
                    throw new MerchantAlreadyInUserException("Merchant already in payment");
                }
                merchant.setMerchantCode(request.merchantCode());
                merchant.setSecretKey(request.secretKey());
                merchant.setActive(request.active());
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

    @Override
    public MerchantResponse getMerchantById(String id, String userId) {
        Optional<Merchant> optional = merchantRepository.findById(id);
        if(optional.isEmpty()) {
            throw new MerchantNotFound("Merchant not found");
        }
        Merchant merchant = optional.get();
        ServiceTokenRequest serviceTokenRequest = new ServiceTokenRequest("client_credentials",clientId, clientSecret, scope);
        ResponseEntity<ApiResponse<String>> tokenResponse = authService.serviceToken(serviceTokenRequest);
        if(tokenResponse.getStatusCode().is2xxSuccessful()) {
            String token = Objects.requireNonNull(tokenResponse.getBody()).data();

            ResponseEntity<ApiResponse<OperatorResponse>> operatorResponse = coreService.getOperatorByUserId(userId, "Bearer " + token);
            if(operatorResponse.getStatusCode().is2xxSuccessful()) {
                String operatorId = Objects.requireNonNull(operatorResponse.getBody()).data().id();
                if(!merchant.getOperatorId().equals(operatorId)) {
                    throw new InvalidAccessException("You do not own this merchant");
                }
                return new MerchantResponse(
                        merchant.getId(),
                        merchant.getOperatorId(),
                        merchant.getProvider().toString(),
                        merchant.getMerchantCode(),
                        merchant.getSecretKey(),
                        merchant.getActive(),
                        merchant.getCreatedAt()
                );
            } else {
                throw new GlobalException("Cant communicate with Core Service");
            }
        } else {
            throw new GlobalException("Cant communicate with Auth Service");
        }
    }

    @Override
    public Page<MerchantResponse> getOperatorMerchant(String userId, Pageable pageable) {
        ServiceTokenRequest serviceTokenRequest = new ServiceTokenRequest("client_credentials",clientId, clientSecret, scope);
        ResponseEntity<ApiResponse<String>> tokenResponse = authService.serviceToken(serviceTokenRequest);
        if(tokenResponse.getStatusCode().is2xxSuccessful()) {
            String token = Objects.requireNonNull(tokenResponse.getBody()).data();

            ResponseEntity<ApiResponse<OperatorResponse>> operatorResponse = coreService.getOperatorByUserId(userId, "Bearer " + token);
            if(operatorResponse.getStatusCode().is2xxSuccessful()) {
                String operatorId = Objects.requireNonNull(operatorResponse.getBody()).data().id();
                return merchantRepository.findByOperatorId(operatorId, pageable)
                        .map(merchant -> new MerchantResponse(
                                merchant.getId(),
                                merchant.getOperatorId(),
                                merchant.getProvider().toString(),
                                merchant.getMerchantCode(),
                                merchant.getSecretKey(),
                                merchant.getActive(),
                                merchant.getCreatedAt()
                        ));
            }
            else {
                throw new GlobalException("Cant communicate with Core Service");
            }
        }
        else {
            throw new GlobalException("Cant communicate with Auth Service");
        }

    }
}
