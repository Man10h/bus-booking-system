package com.Man10h.core_service.service;

import com.Man10h.core_service.model.request.CreateRouteRequest;
import com.Man10h.core_service.model.request.RouteFilter;
import com.Man10h.core_service.model.request.UpdateRouteRequest;
import com.Man10h.core_service.model.response.RouteDetailResponse;
import com.Man10h.core_service.model.response.RouteSummaryResponse;
import org.springframework.data.domain.Page;

public interface RouteService {
    public Page<RouteSummaryResponse> findRoutes(RouteFilter request);
    public RouteDetailResponse getRouteDetailById(Long id);
    public RouteDetailResponse createRoute(String userId, CreateRouteRequest request);
    public RouteDetailResponse updateRoute(Long id, UpdateRouteRequest request);
    public void deactivateRoute(Long id);
}
