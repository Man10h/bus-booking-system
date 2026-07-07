package com.Man10h.core_service.model.request;

public record RouteFilter(
        Long departureCityId,
        Long arrivalCityId,
        String operatorId,
        String status,
        int page,
        int size
) {
}
