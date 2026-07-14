package com.Man10h.core_service.model.response;

import java.math.BigDecimal;

public record TopRouteResponse(
        Long routeId,
        String routeCode,
        BigDecimal revenue
) {}
