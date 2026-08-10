package com.Man10h.auth_service.service.impl;

import com.Man10h.auth_service.controller.exception.*;
import com.Man10h.auth_service.model.entities.RefreshToken;
import com.Man10h.auth_service.model.entities.ServiceClient;
import com.Man10h.auth_service.model.request.ServiceClientRequest;
import com.Man10h.auth_service.model.request.ServiceTokenRequest;
import com.Man10h.auth_service.model.request.UserLoginRequest;
import com.Man10h.auth_service.model.response.ApiResponse;
import com.Man10h.auth_service.model.response.LoginResponse;
import com.Man10h.auth_service.model.response.ServiceClientResponse;
import com.Man10h.auth_service.model.response.UserResponse;
import com.Man10h.auth_service.repository.RefreshTokenRepository;
import com.Man10h.auth_service.repository.ServiceClientRepository;
import com.Man10h.auth_service.service.AuthService;
import com.Man10h.auth_service.service.TokenService;
import com.Man10h.auth_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final ServiceClientRepository serviceClientRepository;
    @Value(
            "${service.users.url}"
    )
    private String usersServiceUrl;

    private final TokenService tokenService;
    private final RestTemplate restTemplate;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    public ServiceClientResponse toServiceClientResponse(ServiceClient serviceClient) {
        return new ServiceClientResponse(
                serviceClient.getId(),
                serviceClient.getClientId(),
                serviceClient.getClientSecret(),
                serviceClient.getScopes(),
                serviceClient.getActive()
        );
    }

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
    @Transactional
    public LoginResponse getTokenByRefreshToken(String refreshToken) {
        Optional<RefreshToken> optionalToken = refreshTokenRepository.findByToken(refreshToken);

        if (optionalToken.isEmpty()) {
            throw new RefreshTokenNotFoundException("Refresh token not found");
        }

        RefreshToken refreshTokenEntity = optionalToken.get();

        // Security: Reuse Detection - If a revoked token is presented, revoke all user tokens (compromised token protection)
        if (refreshTokenEntity.getRevoked()) {
            refreshTokenRepository.revokeAllUserTokens(refreshTokenEntity.getUserId());
            throw new AuthenticationFailedException("Revoked refresh token detected - all user sessions invalidated");
        }

        if (refreshTokenEntity.getExpiresAt() != null && refreshTokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenEntity.setRevoked(true);
            refreshTokenRepository.save(refreshTokenEntity);
            throw new RefreshTokenNotFoundException("Refresh token has expired");
        }

        // Rotate: Revoke the used refresh token
        refreshTokenEntity.setRevoked(true);
        refreshTokenRepository.save(refreshTokenEntity);

        ServiceTokenRequest request = new ServiceTokenRequest("client_credentials", "auth", "auth", "user.read");
        String token = tokenService.generateAuthServiceToken(request);

        ResponseEntity<ApiResponse<UserResponse>> response = userService.getUser(refreshTokenEntity.getUserId(),
                "Bearer " + token);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new AuthenticationFailedException("Service token invalid");
        }

        UserResponse userResponse = response.getBody().data();
        String newAccessToken = tokenService.generateUserToken(userResponse);
        String newRefreshToken = tokenService.generateUserRefreshToken(userResponse);

        // Save rotated new refresh token
        RefreshToken newRefreshTokenDB = RefreshToken.builder()
                .token(newRefreshToken)
                .expiresAt(LocalDateTime.now().plusDays(1L))
                .revoked(false)
                .userId(userResponse.id())
                .build();
        refreshTokenRepository.save(newRefreshTokenDB);

        return new LoginResponse(newAccessToken, newRefreshToken, "user", 10800000L, 86400000L);
    }

    @Transactional
    public ServiceClientResponse createServiceClient(ServiceClientRequest request) {

        Optional<ServiceClient> optional = serviceClientRepository.findByClientId(request.clientId());
        if(optional.isPresent()){
            throw new ClientIdAlreadyExistsException("Client id already exists");
        }
        ServiceClient serviceClient = ServiceClient.builder()
                .clientId(request.clientId())
                .clientSecret(passwordEncoder.encode(request.clientSecret()))
                .scopes(request.scope())
                .active(true)
                .build();
        serviceClientRepository.save(serviceClient);


        return toServiceClientResponse(serviceClient);
    }

    @Transactional
    public ServiceClientResponse updateServiceClient(Long id, ServiceClientRequest request) {

        Optional<ServiceClient> optional = serviceClientRepository.findById(id);
        if(optional.isEmpty()){
            throw new ServiceClientNotFoundException("Service client not found");
        }
        ServiceClient serviceClient = optional.get();
        serviceClient.setClientSecret(passwordEncoder.encode(request.clientSecret()));
        serviceClient.setClientId(request.clientId());
        serviceClient.setScopes(request.scope());

        serviceClientRepository.save(serviceClient);


        return toServiceClientResponse(serviceClient);
    }

    @Override
    public List<ServiceClientResponse> getAllServiceClients() {
        return serviceClientRepository.findAll()
                .stream().map(this::toServiceClientResponse).collect(Collectors.toList());
    }
}
