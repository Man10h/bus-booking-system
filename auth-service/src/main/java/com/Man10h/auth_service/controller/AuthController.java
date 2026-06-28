package com.Man10h.auth_service.controller;

import com.Man10h.auth_service.model.request.UserLoginRequest;
import com.Man10h.auth_service.model.response.ApiResponse;
import com.Man10h.auth_service.model.response.ClaimsResponse;
import com.Man10h.auth_service.model.response.LoginResponse;
import com.Man10h.auth_service.service.AuthService;
import com.Man10h.auth_service.service.TokenService;
import com.nimbusds.jose.jwk.JWKSet;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
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
}
