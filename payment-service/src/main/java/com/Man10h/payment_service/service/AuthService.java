package com.Man10h.payment_service.service;

import com.Man10h.payment_service.model.request.ServiceTokenRequest;
import com.Man10h.payment_service.model.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "auth", url = "${services.auth.url}")
public interface AuthService {

    @PostMapping("/service-token")
    public ResponseEntity<ApiResponse<String>> serviceToken(@RequestBody @Valid ServiceTokenRequest request);
}
