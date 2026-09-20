package com.Man10h.core_service.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionalCacheEvictor {
    private final CacheManager cacheManager;

    /**
     * Evicts the entire specified cache asynchronously after the active database transaction commits.
     * If no active transaction exists, it evicts the cache immediately in the background.
     *
     * @param cacheName the name of the cache to evict
     */
    public void evictAfterCommit(String cacheName) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    CompletableFuture.runAsync(() -> doEvict(cacheName));
                }
            });
        } else {
            CompletableFuture.runAsync(() -> doEvict(cacheName));
        }
    }

    private final java.util.concurrent.ConcurrentHashMap<String, Long> lastEvictTime = new java.util.concurrent.ConcurrentHashMap<>();

    private void doEvict(String cacheName) {
        long now = System.currentTimeMillis();
        Long lastTime = lastEvictTime.get(cacheName);
        if (lastTime != null && now - lastTime < 500) {
            // Already cleared within last 500ms, skip duplicate full clear
            return;
        }
        lastEvictTime.put(cacheName, now);

        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                log.debug("Safely cleared cache '{}' after transaction commit", cacheName);
            }
        } catch (Exception e) {
            log.error("Failed to evict cache '{}': {}", cacheName, e.getMessage(), e);
        }
    }
}
