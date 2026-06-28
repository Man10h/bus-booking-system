package com.Man10h.auth_service.service.impl;

import com.Man10h.auth_service.controller.exception.AuthenticationFailedException;
import com.Man10h.auth_service.controller.exception.InvalidTokenException;
import com.Man10h.auth_service.model.entities.RefreshToken;
import com.Man10h.auth_service.model.request.UserLoginRequest;
import com.Man10h.auth_service.model.response.ApiResponse;
import com.Man10h.auth_service.model.response.LoginResponse;
import com.Man10h.auth_service.model.response.UserResponse;
import com.Man10h.auth_service.repository.RefreshTokenRepository;
import com.Man10h.auth_service.service.AuthService;
import com.Man10h.auth_service.service.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    @Value(
            "${usersService.url}"
    )
    private String usersServiceUrl;

    private final TokenService tokenService;
    private final RestTemplate restTemplate;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public LoginResponse login(UserLoginRequest request) {
        //check login
        String url = usersServiceUrl + "/check-credentials";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<UserLoginRequest> requestEntity = new HttpEntity<>(request, headers);

        ResponseEntity<ApiResponse<UserResponse>> response =
                restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        requestEntity,
                        new ParameterizedTypeReference<ApiResponse<UserResponse>>() {})
                ;

        if(!response.getStatusCode().is2xxSuccessful()){
            //
            throw new AuthenticationFailedException("Login failed");
        }
        UserResponse userResponse =  Objects.requireNonNull(response.getBody()).data();

        String accessToken =  tokenService.generateUserToken(userResponse);
        String refreshToken = tokenService.generateUserRefreshToken(userResponse);
        RefreshToken refreshTokenDB = RefreshToken.builder()
                .token(refreshToken)
                .expiresAt(LocalDateTime.now().plusDays(1L))
                .revoked(false)
                .userId(userResponse.id())
                .build();
        refreshTokenRepository.save(refreshTokenDB);


        return new LoginResponse(accessToken, refreshToken, "user", 10800000L, 86400000L);
    }

    @Override
    public LoginResponse getTokenByRefreshToken(String refreshToken) {
        //not done
        return null;
    }
}
