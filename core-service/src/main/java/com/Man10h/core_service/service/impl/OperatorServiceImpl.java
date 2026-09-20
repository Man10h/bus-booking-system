package com.Man10h.core_service.service.impl;

import com.Man10h.core_service.controller.exception.OperatorAlreadyRegisterException;
import com.Man10h.core_service.controller.exception.OperatorNotFoundException;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.model.request.CreateOperatorRequest;
import com.Man10h.core_service.model.request.UpdateOperatorRequest;
import com.Man10h.core_service.model.response.OperatorResponse;
import com.Man10h.core_service.repository.OperatorRepository;
import com.Man10h.core_service.service.OperatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OperatorServiceImpl implements OperatorService {

    private final OperatorRepository operatorRepository;
    private final com.Man10h.core_service.service.MasterDataCacheService masterDataCacheService;

    @Transactional
    public OperatorResponse createOperator(String userId, CreateOperatorRequest request) {
        if(operatorRepository.existsByUserId(userId)) {
            throw new OperatorAlreadyRegisterException("User already registered operator");
        }
        if(operatorRepository.existsByTaxCode(request.taxCode())){
            throw new OperatorAlreadyRegisterException("Tax code already used");
        }
        Operator operator = Operator.builder()
                .companyName(request.companyName())
                .contactPhone(request.contactPhone())
                .taxCode(request.taxCode())
                .userId(userId)
                .vehicleList(new ArrayList<>())
                .routeList(new ArrayList<>())
                .avatarUrl(null)
                .build();

        operatorRepository.save(operator);
        return new OperatorResponse(operator.getId(), operator.getCompanyName(), operator.getContactPhone(), operator.getTaxCode(), operator.getAvatarUrl());
    }

    @Transactional
    public void updateOperator(String userId, UpdateOperatorRequest request) {
        Optional<Operator> optional = operatorRepository.findByUserId(userId);
        if(optional.isEmpty()){
            throw new OperatorNotFoundException("Operator not found");
        }
        Operator operator = optional.get();
        operator.setCompanyName(request.companyName());
        operator.setContactPhone(request.contactPhone());
        operator.setTaxCode(request.taxCode());
        operator.setAvatarUrl(request.avatarUrl());
        operatorRepository.save(operator);
        masterDataCacheService.evictOperator(userId);
    }

    @Override
    public OperatorResponse getOperatorByUserId(String userId) {
        Optional<Operator> optional = operatorRepository.findByUserId(userId);
        if(optional.isEmpty()){
            throw new OperatorNotFoundException("Operator not found");
        }
        Operator operator = optional.get();
        return new OperatorResponse(operator.getId(), operator.getCompanyName(), operator.getContactPhone(), operator.getTaxCode(), operator.getAvatarUrl());
    }

    @Override
    public OperatorResponse getOperatorByOperatorId(String operatorId) {
        Optional<Operator> optional = operatorRepository.findById(operatorId);
        if(optional.isEmpty()){
            throw new OperatorNotFoundException("Operator not found");
        }
        Operator operator = optional.get();
        return new OperatorResponse(operator.getId(), operator.getCompanyName(), operator.getContactPhone(), operator.getTaxCode(), operator.getAvatarUrl());
    }

    @Override
    public List<OperatorResponse> getAllOperators() {
        return operatorRepository.findAll()
                .stream().map(operator -> new OperatorResponse(operator.getId(), operator.getCompanyName(), operator.getContactPhone(), operator.getTaxCode(), operator.getAvatarUrl()))
                .collect(Collectors.toList());
    }


}
