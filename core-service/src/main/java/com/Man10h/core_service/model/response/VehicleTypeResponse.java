package com.Man10h.core_service.model.response;

public record VehicleTypeResponse (
        Long id,
        String code,
        String name,
        int floors,
        int rows,
        int cols
){
}
