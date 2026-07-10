package com.Man10h.auth_service.controller;

import com.Man10h.auth_service.model.request.RefreshTokenRequest;
import com.Man10h.auth_service.model.request.ServiceClientRequest;
import com.Man10h.auth_service.model.request.ServiceTokenRequest;
import com.Man10h.auth_service.model.request.UserLoginRequest;
import com.Man10h.auth_service.model.response.ApiResponse;
import com.Man10h.auth_service.model.response.ClaimsResponse;
import com.Man10h.auth_service.model.response.LoginResponse;
import com.Man10h.auth_service.model.response.ServiceClientResponse;
import com.Man10h.auth_service.service.AuthService;
import com.Man10h.auth_service.service.TokenService;
import com.nimbusds.jose.jwk.JWKSet;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;
    private final JWKSet jwkSet;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody @Valid UserLoginRequest request) {
        LoginResponse data = authService.login(request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @GetMapping("/.well-known/jwks.json")
    public Map<String, Object> keys() {
        return jwkSet.toJSONObject();
    }

    @PostMapping("/service-token")
    public ResponseEntity<ApiResponse<String>> serviceToken(@RequestBody @Valid ServiceTokenRequest request) {
        String data = tokenService.generateServiceToken(request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(@RequestBody RefreshTokenRequest request) {
        LoginResponse data = authService.getTokenByRefreshToken(request.refreshToken());
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/service-client")
    public ResponseEntity<ApiResponse<List<ServiceClientResponse>>> getServiceClients() {
        List<ServiceClientResponse> data = authService.getAllServiceClients();
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/service-client")
    public ResponseEntity<ApiResponse<ServiceClientResponse>> createServiceClient(@RequestBody @Valid ServiceClientRequest request) {
        ServiceClientResponse data = authService.createServiceClient(request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/service-client/{id}")
    public ResponseEntity<ApiResponse<ServiceClientResponse>> updateServiceClient(@PathVariable Long id, @RequestBody @Valid ServiceClientRequest request) {
        ServiceClientResponse data = authService.updateServiceClient(id, request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }
}
