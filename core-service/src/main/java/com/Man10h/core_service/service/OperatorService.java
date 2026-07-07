package com.Man10h.core_service.service;

import com.Man10h.core_service.model.request.CreateOperatorRequest;
import com.Man10h.core_service.model.request.UpdateOperatorRequest;
import com.Man10h.core_service.model.response.OperatorResponse;

public interface OperatorService {
    public OperatorResponse createOperator(String userId, CreateOperatorRequest request);
    public void updateOperator(String userId, UpdateOperatorRequest request);
    public OperatorResponse getOperatorByUserId(String userId);
    public OperatorResponse getOperatorByOperatorId(String operatorId);
}
