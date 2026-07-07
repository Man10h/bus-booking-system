package com.Man10h.auth_service.service;

import com.Man10h.auth_service.model.request.ServiceClientRequest;
import com.Man10h.auth_service.model.request.UserLoginRequest;
import com.Man10h.auth_service.model.response.LoginResponse;
import com.Man10h.auth_service.model.response.ServiceClientResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AuthService {
    public LoginResponse login(UserLoginRequest request);
    public LoginResponse getTokenByRefreshToken(String refreshToken);
    public ServiceClientResponse createServiceClient(ServiceClientRequest request);
    public ServiceClientResponse updateServiceClient(Long id, ServiceClientRequest request);
    public List<ServiceClientResponse> getAllServiceClients();
}
