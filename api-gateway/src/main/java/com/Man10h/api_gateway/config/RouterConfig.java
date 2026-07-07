package com.Man10h.api_gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouterConfig {

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth-service",
                        r -> r
                                .path("/auth/**")
                                .uri("lb://auth-service:8000")
                )
                .route("user-service",
                        r -> r
                                .path("/users/**")
                                .uri("lb://user-service:8001")
                )
                .route("core-service",
                        r -> r
                                .path("/core/**")
                                .uri("lb://core-service:8002")
                )
                .build();
    }
}
