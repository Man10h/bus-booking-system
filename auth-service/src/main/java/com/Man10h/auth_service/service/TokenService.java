package com.Man10h.auth_service.service;

import com.Man10h.auth_service.model.request.ServiceTokenRequest;
import com.Man10h.auth_service.model.response.UserResponse;


public interface TokenService {
    public String generateUserToken(UserResponse userResponse);
    public String generateUserRefreshToken(UserResponse userResponse);
    public String generateServiceToken(ServiceTokenRequest request);
}
