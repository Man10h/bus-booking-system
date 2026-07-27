package com.Man10h.core_service.service;

import com.Man10h.core_service.model.request.CreateRouteRequest;
import com.Man10h.core_service.model.request.RouteFilter;
import com.Man10h.core_service.model.request.UpdateRouteRequest;
import com.Man10h.core_service.model.response.RouteDetailResponse;
import com.Man10h.core_service.model.response.RoutePageResponse;
import com.Man10h.core_service.model.response.RouteSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RouteService {
    public RoutePageResponse findRoutes(RouteFilter request, Pageable pageable);
    public RouteDetailResponse getRouteDetailById(Long id);
    public RouteDetailResponse createRoute(String userId, CreateRouteRequest request);
    public RouteDetailResponse updateRoute(Long id, String userid, UpdateRouteRequest request);
    public void deactivateRoute(String userId, Long id);
    public void activeRoute(String userId, Long id);
}
