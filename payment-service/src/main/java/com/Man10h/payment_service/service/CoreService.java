package com.Man10h.payment_service.service;

import com.Man10h.payment_service.model.response.ApiResponse;
import com.Man10h.payment_service.model.response.BookingSummaryResponse;
import com.Man10h.payment_service.model.response.OperatorResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "core", url = "${services.core.url}")
public interface CoreService {

    @GetMapping("/operators/by-user/{userId}")
    ResponseEntity<ApiResponse<OperatorResponse>> getOperatorByUserId(
            @PathVariable("userId") String userId,
            @RequestHeader("Authorization") String authorization
    );

    @GetMapping("/bookings/{id}")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> getBookingById(@PathVariable Long id,
                                                                              @RequestHeader("Authorization") String authorization);

}
