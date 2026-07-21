package com.Man10h.core_service.model.response;

import com.Man10h.core_service.model.enums.RouteStatus;

import java.io.Serializable;
import java.math.BigDecimal;

public record RouteSummaryResponse(
    Long id,
    String routeCode,
    BigDecimal distance,
    Long estimatedDurationMinutes,
    RouteStatus status,
    OperatorResponse operatorResponse,
    String arrivalCityName,
    String departureCityName
) implements Serializable {
}
