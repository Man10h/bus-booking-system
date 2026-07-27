package com.Man10h.core_service.controller;

import com.Man10h.core_service.model.request.CreateRouteRequest;
import com.Man10h.core_service.model.request.RouteFilter;
import com.Man10h.core_service.model.request.UpdateRouteRequest;
import com.Man10h.core_service.model.response.*;
import com.Man10h.core_service.service.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/core")
@RestController
@RequiredArgsConstructor
public class RouteController {
    private final RouteService routeService;

    @GetMapping("/routes")
    public ResponseEntity<ApiResponse<RoutePageResponse>> findRoutes(@ModelAttribute RouteFilter request,
                                                                     @RequestParam(name = "page", defaultValue = "0") int page,
                                                                     @RequestParam(name = "size", defaultValue = "10") int size) {
        RoutePageResponse data = routeService.findRoutes(request, PageRequest.of(page, size));
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @GetMapping("/routes/{routeId}")
    public ResponseEntity<ApiResponse<RouteDetailResponse>> getRouteDetail(@PathVariable Long routeId) {
        RouteDetailResponse data = routeService.getRouteDetailById(routeId);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PostMapping("/routes")
    public ResponseEntity<ApiResponse<RouteDetailResponse>> createRoute(@RequestBody CreateRouteRequest request,
                                                                        @AuthenticationPrincipal Jwt jwt) {
        RouteDetailResponse data = routeService.createRoute(jwt.getSubject(), request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PutMapping("/routes/{routeId}")
    public ResponseEntity<ApiResponse<RouteDetailResponse>> updateRoute(@PathVariable Long routeId,
                                                                        @RequestBody UpdateRouteRequest request,
                                                                        @AuthenticationPrincipal Jwt jwt) {
        RouteDetailResponse data = routeService.updateRoute(routeId, jwt.getSubject(), request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PatchMapping("/routes/{routeId}/inactive")
    public ResponseEntity<ApiResponse<?>> deactivateRoute(@PathVariable Long routeId,
                                                          @AuthenticationPrincipal Jwt jwt) {
        routeService.deactivateRoute(jwt.getSubject(), routeId);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PatchMapping("/routes/{routeId}/active")
    public ResponseEntity<ApiResponse<?>> activeRoute(@PathVariable Long routeId,
                                                          @AuthenticationPrincipal Jwt jwt) {
        routeService.activeRoute(jwt.getSubject(), routeId);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }
}
