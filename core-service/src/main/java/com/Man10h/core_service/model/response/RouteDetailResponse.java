package com.Man10h.core_service.model.response;

import com.Man10h.core_service.model.enums.RouteStatus;

import java.math.BigDecimal;
import java.util.List;

public record RouteDetailResponse(
        Long id,
        String routeCode,
        BigDecimal distance,
        Long estimatedDurationMinutes,
        RouteStatus status,
        OperatorResponse operatorResponse,
        String arrivalCityName,
        String departureCityName,
        List<RouteStopResponse> routeStopResponse
) {
}
