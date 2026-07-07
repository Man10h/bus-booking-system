package com.Man10h.auth_service.model.response;

public record ServiceClientResponse (
        Long id,
        String clientId,
        String clientSecret,
        String scope,
        Boolean active
){
}
