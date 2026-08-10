package com.Man10h.api_gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouterConfig {

    private final RedisRateLimiter redisRateLimiter;
    private final KeyResolver ipKeyResolver;

    public RouterConfig(RedisRateLimiter redisRateLimiter, KeyResolver ipKeyResolver) {
        this.redisRateLimiter = redisRateLimiter;
        this.ipKeyResolver = ipKeyResolver;
    }

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth-service",
                        r -> r
                                .path("/auth/**")
                                .filters(f -> f.requestRateLimiter(c -> c.setRateLimiter(redisRateLimiter).setKeyResolver(ipKeyResolver)))
                                .uri("lb://auth-service:8000")
                )
                .route("user-service",
                        r -> r
                                .path("/users/**")
                                .filters(f -> f.requestRateLimiter(c -> c.setRateLimiter(redisRateLimiter).setKeyResolver(ipKeyResolver)))
                                .uri("lb://user-service:8001")
                )
                .route("core-service",
                        r -> r
                                .path("/core/**")
                                .filters(f -> f.requestRateLimiter(c -> c.setRateLimiter(redisRateLimiter).setKeyResolver(ipKeyResolver)))
                                .uri("lb://core-service:8002")
                )
                .route("payment-service",
                        r -> r
                                .path("/payments/**")
                                .filters(f -> f.requestRateLimiter(c -> c.setRateLimiter(redisRateLimiter).setKeyResolver(ipKeyResolver)))
                                .uri("lb://payment-service:8003")
                )
                .route("notification-service",
                        r -> r
                                .path("/notifications/**")
                                .filters(f -> f.requestRateLimiter(c -> c.setRateLimiter(redisRateLimiter).setKeyResolver(ipKeyResolver)))
                                .uri("lb://notification-service:8004")
                )
                .build();
    }
}
