package com.Man10h.core_service.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
@Slf4j
public class IdempotencyHelper {
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    private static final String IDEMPOTENCY_PREFIX = "idemp:";
    private static final String PROCESSING = "PROCESSING";

    /**
     * Tries to acquire an idempotency lock for the given key.
     *
     * @param key        the unique idempotency key
     * @param ttlSeconds lock timeout in seconds (to prevent lock leaks)
     * @return true if this is the first request and lock is acquired; false if duplicate or currently processing
     */
    public boolean tryAcquire(String key, long ttlSeconds) {
        if (key == null || key.isBlank()) {
            return true; // If no idempotency key provided, proceed normally
        }
        Boolean success = stringRedisTemplate.opsForValue()
                .setIfAbsent(IDEMPOTENCY_PREFIX + key, PROCESSING, Duration.ofSeconds(ttlSeconds));
        return Boolean.TRUE.equals(success);
    }

    /**
     * Releases or deletes the idempotency key upon failure so client can retry immediately.
     *
     * @param key the unique idempotency key
     */
    public void release(String key) {
        if (key != null && !key.isBlank()) {
            try {
                stringRedisTemplate.delete(IDEMPOTENCY_PREFIX + key);
            } catch (Exception e) {
                log.warn("Failed to delete idempotency key '{}': {}", key, e.getMessage());
            }
        }
    }
}
