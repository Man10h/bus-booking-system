package com.Man10h.payment_service.controller;

import com.Man10h.payment_service.model.request.CreateMerchantRequest;
import com.Man10h.payment_service.model.request.CreatePaymentRequest;
import com.Man10h.payment_service.model.request.UpdateMerchantRequest;
import com.Man10h.payment_service.model.response.ApiResponse;
import com.Man10h.payment_service.model.response.MerchantResponse;
import com.Man10h.payment_service.model.response.PaymentResponse;
import com.Man10h.payment_service.service.MerchantService;
import com.Man10h.payment_service.service.PaymentService;
import com.Man10h.payment_service.service.impl.VNPayServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    private final MerchantService merchantService;
    private final VNPayServiceImpl vnPayService;


    @PreAuthorize("hasRole('OPERATOR')")
    @PostMapping("/merchants")
    public ResponseEntity<ApiResponse<MerchantResponse>> createMerchant(@RequestBody @Valid CreateMerchantRequest request,
                                                                        @AuthenticationPrincipal Jwt jwt) {

        MerchantResponse data = merchantService.createMerchant(jwt.getSubject(), request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PutMapping("/merchants/{id}")
    public ResponseEntity<ApiResponse<MerchantResponse>> updateMerchant(@RequestBody @Valid UpdateMerchantRequest request,
                                                                        @AuthenticationPrincipal Jwt jwt,
                                                                        @PathVariable String id) {
        MerchantResponse data = merchantService.updateMerchant(id, jwt.getSubject(), request);

        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @GetMapping("/merchants/{id}")
    public ResponseEntity<ApiResponse<MerchantResponse>> getMerchant(@PathVariable String id,
                                                                     @AuthenticationPrincipal Jwt jwt) {
        MerchantResponse data = merchantService.getMerchantById(id, jwt.getSubject());
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<ApiResponse<String>> createPayment(@RequestBody @Valid CreatePaymentRequest request,
                                                             @AuthenticationPrincipal Jwt jwt) {
        String data = paymentService.createPayment(jwt.getSubject(), request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @GetMapping("/vnpay/ipn")
    public ResponseEntity<?> ipn(
            @RequestParam Map<String, String> params
    ) {
        vnPayService.processIpn(params);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> getUserPayments(@AuthenticationPrincipal Jwt jwt,
                                                                              @RequestParam(name = "page", defaultValue = "page") int page,
                                                                              @RequestParam(name = "size", defaultValue = "size") int size){
        Page<PaymentResponse> data = paymentService.getUserPayments(jwt.getSubject(), PageRequest.of(page, size));
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }
}
