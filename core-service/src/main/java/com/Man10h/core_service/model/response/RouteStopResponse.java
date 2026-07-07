package com.Man10h.core_service.model.response;

import java.math.BigDecimal;

public record RouteStopResponse(
        Long id,
        Long stopOrder,
        String stopName,
        BigDecimal distanceFromStart,
        Long estimatedArrivalOffsetMinutes,
        Boolean isPickup,
        Boolean isDropOff,
        String cityName
) {
}
