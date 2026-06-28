package com.Man10h.auth_service.service;

import com.Man10h.auth_service.model.request.UserLoginRequest;
import com.Man10h.auth_service.model.response.LoginResponse;

public interface AuthService {
    public LoginResponse login(UserLoginRequest request);
    public LoginResponse getTokenByRefreshToken(String refreshToken);
}
