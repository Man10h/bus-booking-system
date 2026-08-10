package com.Man10h.auth_service.service;

import com.Man10h.auth_service.controller.exception.AuthenticationFailedException;
import com.Man10h.auth_service.controller.exception.ClientIdAlreadyExistsException;
import com.Man10h.auth_service.model.entities.RefreshToken;
import com.Man10h.auth_service.model.entities.ServiceClient;
import com.Man10h.auth_service.model.request.ServiceClientRequest;
import com.Man10h.auth_service.model.request.UserLoginRequest;
import com.Man10h.auth_service.model.response.ApiResponse;
import com.Man10h.auth_service.model.response.LoginResponse;
import com.Man10h.auth_service.model.response.ServiceClientResponse;
import com.Man10h.auth_service.model.response.UserResponse;
import com.Man10h.auth_service.repository.RefreshTokenRepository;
import com.Man10h.auth_service.repository.ServiceClientRepository;
import com.Man10h.auth_service.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private ServiceClientRepository serviceClientRepository;
    @Mock
    private TokenService tokenService;
    @Mock
    private RestTemplate restTemplate;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UserService userService;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "usersServiceUrl", "http://user-service:8001/users");
    }

    @Test
    @DisplayName("Should successfully authenticate user and return access/refresh tokens")
    void login_Success() {
        UserLoginRequest loginRequest = new UserLoginRequest("john_doe", "password123");
        UserResponse userResponse = new UserResponse("usr-123", "john@example.com", "0912345678", "John Doe", "123 Street", "MALE", "avatar.png", true, java.time.LocalDateTime.now(), "ROLE_USER");
        ApiResponse<UserResponse> apiResponse = new ApiResponse<>(userResponse, "Success", 200);
        ResponseEntity<ApiResponse<UserResponse>> responseEntity = new ResponseEntity<>(apiResponse, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("http://user-service:8001/users/check-credentials"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)
        )).thenReturn(responseEntity);

        when(tokenService.generateUserToken(userResponse)).thenReturn("mocked-access-token");
        when(tokenService.generateUserRefreshToken(userResponse)).thenReturn("mocked-refresh-token");

        LoginResponse loginResponse = authService.login(loginRequest);

        assertNotNull(loginResponse);
        assertEquals("mocked-access-token", loginResponse.accessToken());
        assertEquals("mocked-refresh-token", loginResponse.refreshToken());
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should throw AuthenticationFailedException when user-service credentials check fails")
    void login_CredentialsInvalid() {
        UserLoginRequest loginRequest = new UserLoginRequest("john_doe", "wrongpass");
        ResponseEntity<ApiResponse<UserResponse>> responseEntity = new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        when(restTemplate.exchange(
                eq("http://user-service:8001/users/check-credentials"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)
        )).thenReturn(responseEntity);

        assertThrows(AuthenticationFailedException.class, () -> authService.login(loginRequest));
        verify(tokenService, never()).generateUserToken(any());
    }

    @Test
    @DisplayName("Should create service client successfully")
    void createServiceClient_Success() {
        ServiceClientRequest request = new ServiceClientRequest("core-client", "secret123", "core.read core.write");

        when(serviceClientRepository.findByClientId("core-client")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret123")).thenReturn("encoded-secret");
        when(serviceClientRepository.save(any(ServiceClient.class))).thenAnswer(i -> {
            ServiceClient sc = i.getArgument(0);
            sc.setId(1L);
            return sc;
        });

        ServiceClientResponse response = authService.createServiceClient(request);

        assertNotNull(response);
        assertEquals("core-client", response.clientId());
        assertTrue(response.active());
        verify(serviceClientRepository, times(1)).save(any(ServiceClient.class));
    }

    @Test
    @DisplayName("Should successfully rotate refresh token and revoke old token")
    void tokenRotation_Success() {
        String oldTokenStr = "old-refresh-token";
        RefreshToken oldToken = RefreshToken.builder()
                .id(1L)
                .token(oldTokenStr)
                .userId("usr-123")
                .revoked(false)
                .expiresAt(java.time.LocalDateTime.now().plusHours(5))
                .build();

        UserResponse userResponse = new UserResponse("usr-123", "john@example.com", "0912345678", "John Doe", "123 Street", "MALE", "avatar.png", true, java.time.LocalDateTime.now(), "ROLE_USER");
        ApiResponse<UserResponse> apiResponse = new ApiResponse<>(userResponse, "Success", 200);
        ResponseEntity<ApiResponse<UserResponse>> responseEntity = new ResponseEntity<>(apiResponse, HttpStatus.OK);

        when(refreshTokenRepository.findByToken(oldTokenStr)).thenReturn(Optional.of(oldToken));
        when(tokenService.generateAuthServiceToken(any())).thenReturn("auth-service-token");
        when(userService.getUser(eq("usr-123"), anyString())).thenReturn(responseEntity);
        when(tokenService.generateUserToken(userResponse)).thenReturn("new-access-token");
        when(tokenService.generateUserRefreshToken(userResponse)).thenReturn("new-refresh-token");

        LoginResponse loginResponse = authService.getTokenByRefreshToken(oldTokenStr);

        assertNotNull(loginResponse);
        assertEquals("new-access-token", loginResponse.accessToken());
        assertEquals("new-refresh-token", loginResponse.refreshToken());
        assertTrue(oldToken.getRevoked(), "Old refresh token must be revoked");
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should detect revoked token reuse and invalidate all user tokens")
    void tokenRotation_RevokedToken_ReuseDetection() {
        String revokedTokenStr = "revoked-stolen-token";
        RefreshToken revokedToken = RefreshToken.builder()
                .id(1L)
                .token(revokedTokenStr)
                .userId("usr-123")
                .revoked(true)
                .build();

        when(refreshTokenRepository.findByToken(revokedTokenStr)).thenReturn(Optional.of(revokedToken));

        assertThrows(AuthenticationFailedException.class, () -> authService.getTokenByRefreshToken(revokedTokenStr));
        verify(refreshTokenRepository, times(1)).revokeAllUserTokens("usr-123");
    }
}
