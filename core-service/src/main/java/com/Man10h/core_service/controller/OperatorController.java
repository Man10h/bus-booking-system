package com.Man10h.core_service.controller;

import com.Man10h.core_service.model.request.CreateOperatorRequest;
import com.Man10h.core_service.model.request.UpdateOperatorRequest;
import com.Man10h.core_service.model.response.ApiResponse;
import com.Man10h.core_service.model.response.OperatorResponse;
import com.Man10h.core_service.model.response.VehicleResponse;
import com.Man10h.core_service.service.OperatorService;
import com.Man10h.core_service.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/core")
@RestController
@RequiredArgsConstructor
public class OperatorController {
    private final OperatorService operatorService;

    @GetMapping("/operators")
    public ResponseEntity<ApiResponse<List<OperatorResponse>>> getAllOperators() {
        List<OperatorResponse> data = operatorService.getAllOperators();
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @GetMapping("/operators/me")
    public ResponseEntity<ApiResponse<OperatorResponse>> getOperatorByUserId(@AuthenticationPrincipal Jwt jwt) {
        OperatorResponse data = operatorService.getOperatorByUserId(jwt.getSubject());
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/operators/{operatorId}")
    public ResponseEntity<ApiResponse<OperatorResponse>> getOperatorByOperatorId(@PathVariable("operatorId") String operatorId) {
        OperatorResponse data = operatorService.getOperatorByOperatorId(operatorId);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PostMapping("/operators")
    public ResponseEntity<ApiResponse<OperatorResponse>> createOperator(@AuthenticationPrincipal Jwt jwt,
                                                                        @RequestBody @Valid CreateOperatorRequest request){
        OperatorResponse data = operatorService.createOperator(jwt.getSubject(), request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 201));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PutMapping("/operators")
    public ResponseEntity<ApiResponse<?>> updateOperator(@AuthenticationPrincipal Jwt jwt,
                                                         @RequestBody @Valid UpdateOperatorRequest request){
        operatorService.updateOperator(jwt.getSubject(), request);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }


    @PreAuthorize("hasAuthority('SCOPE_core.read')")
    @GetMapping("/operators/by-user/{userId}")
    public ResponseEntity<ApiResponse<OperatorResponse>> getOperatorByUserId(@PathVariable("userId") String userId){
        OperatorResponse data = operatorService.getOperatorByUserId(userId);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    /*
    * tim kiem operator
    * */
}
