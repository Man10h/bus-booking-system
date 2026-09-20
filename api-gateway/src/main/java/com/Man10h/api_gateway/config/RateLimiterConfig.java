package com.Man10h.api_gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import reactor.core.publisher.Mono;

import java.util.Objects;

@Configuration
public class RateLimiterConfig {

    @Bean
    @Primary
    public KeyResolver ipKeyResolver() {
        return exchange -> exchange.getPrincipal()
                .filter(p -> p instanceof org.springframework.security.core.Authentication)
                .cast(org.springframework.security.core.Authentication.class)
                .map(org.springframework.security.core.Authentication::getName)
                .switchIfEmpty(Mono.defer(() -> {
                    String forwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
                    if (forwardedFor != null && !forwardedFor.isBlank()) {
                        return Mono.just(forwardedFor.split(",")[0].trim());
                    }
                    if (exchange.getRequest().getRemoteAddress() != null && exchange.getRequest().getRemoteAddress().getAddress() != null) {
                        return Mono.just(exchange.getRequest().getRemoteAddress().getAddress().getHostAddress());
                    }
                    return Mono.just("anonymous");
                }));
    }

    @Bean
    public RedisRateLimiter redisRateLimiter() {
        // replenishRate: 500 requests per second
        // burstCapacity: 1000 maximum tokens
        // requestedTokens: 1 token per request
        return new RedisRateLimiter(500, 1000, 1);
    }
}
