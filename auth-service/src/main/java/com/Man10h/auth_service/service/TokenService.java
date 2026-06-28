package com.Man10h.auth_service.service;

import com.Man10h.auth_service.model.response.ClaimsResponse;
import com.Man10h.auth_service.model.response.UserResponse;

import java.time.LocalDateTime;

public interface TokenService {
    public String generateUserToken(UserResponse userResponse);
    public String generateUserRefreshToken(UserResponse userResponse);
}
