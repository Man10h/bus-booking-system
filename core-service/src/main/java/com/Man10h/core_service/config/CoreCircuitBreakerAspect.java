package com.Man10h.core_service.config;

import com.Man10h.core_service.model.response.ApiResponse;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Aspect
@Component("coreCircuitBreakerAspect")
public class CoreCircuitBreakerAspect {

    private final CircuitBreaker circuitBreaker;

    public CoreCircuitBreakerAspect(CircuitBreakerRegistry registry) {
        this.circuitBreaker = registry.circuitBreaker("coreServiceCB");
    }

    @Around("execution(* com.Man10h.core_service.controller.OperatorController.getOperatorByUserId(String)) || " +
            "execution(* com.Man10h.core_service.controller.BookingController.getBookingById(Long))")
    public Object wrapWithCircuitBreaker(ProceedingJoinPoint joinPoint) throws Throwable {
        try {
            return circuitBreaker.executeCheckedSupplier(joinPoint::proceed);
        } catch (CallNotPermittedException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ApiResponse<>(null, "Service temporary unavailable (Circuit Breaker Open)", 503));
        }
    }
}
