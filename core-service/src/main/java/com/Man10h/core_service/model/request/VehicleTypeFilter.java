package com.Man10h.core_service.model.request;

public record VehicleTypeFilter(
        String keyword,
        String seatType,
        Integer floors
) {}
