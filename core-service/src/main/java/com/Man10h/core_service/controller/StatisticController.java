package com.Man10h.core_service.controller;

import com.Man10h.core_service.model.request.StatisticFilter;
import com.Man10h.core_service.model.response.*;
import com.Man10h.core_service.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/core")
@RestController
@RequiredArgsConstructor
public class StatisticController {
    private final BookingService bookingService;


    @PreAuthorize("hasRole('OPERATOR')")
    @GetMapping("/statistic/overview")
    public ResponseEntity<ApiResponse<StatisticalOverviewResponse>> getStatisticalOverview(@AuthenticationPrincipal Jwt jwt) {
        StatisticalOverviewResponse data = bookingService.getStatisticalOverview(jwt.getSubject());
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @GetMapping("/statistic/revenue")
    public ResponseEntity<ApiResponse<List<TimeStatisticResponse>>> getRevenueByFilter(@AuthenticationPrincipal Jwt jwt,
                                                                                           @ModelAttribute StatisticFilter filter) {
        List<TimeStatisticResponse> data = bookingService.getTimeStatistic(jwt.getSubject(), filter);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @GetMapping("/statistic/routes/top")
    public ResponseEntity<ApiResponse<List<TopRouteResponse>>> getTopRoutes(@AuthenticationPrincipal Jwt jwt) {
        List<TopRouteResponse> data = bookingService.getTopRoutes(jwt.getSubject());
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @GetMapping("/statistic/vehicles/top")
    public ResponseEntity<ApiResponse<List<TopVehicleResponse>>> getTopVehicles(@AuthenticationPrincipal Jwt jwt) {
        List<TopVehicleResponse> data = bookingService.getTopVehicles(jwt.getSubject());
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }
}
