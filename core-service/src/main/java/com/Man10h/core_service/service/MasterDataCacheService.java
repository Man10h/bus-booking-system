package com.Man10h.core_service.service;

import com.Man10h.core_service.model.entities.City;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.repository.CityRepository;
import com.Man10h.core_service.repository.OperatorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MasterDataCacheService {

    private final CityRepository cityRepository;
    private final OperatorRepository operatorRepository;

    private final Map<Long, City> cityCache = new ConcurrentHashMap<>();
    private final Map<String, Operator> operatorCache = new ConcurrentHashMap<>();

    @EventListener(ApplicationReadyEvent.class)
    public void preloadCache() {
        try {
            List<City> cities = cityRepository.findAll();
            for (City city : cities) {
                cityCache.put(city.getId(), city);
            }
            log.info("MasterDataCacheService: Preloaded {} cities into in-memory cache", cityCache.size());
        } catch (Exception e) {
            log.warn("MasterDataCacheService: Could not preload cities during startup: {}", e.getMessage());
        }
    }

    public Map<Long, City> getCitiesByIds(Set<Long> ids) {
        if (cityCache.isEmpty()) {
            preloadCache();
        }

        Map<Long, City> result = new HashMap<>();
        Set<Long> missingIds = new HashSet<>();

        for (Long id : ids) {
            City cached = cityCache.get(id);
            if (cached != null) {
                result.put(id, cached);
            } else {
                missingIds.add(id);
            }
        }

        if (!missingIds.isEmpty()) {
            List<City> fromDb = cityRepository.findAllById(missingIds);
            for (City city : fromDb) {
                cityCache.put(city.getId(), city);
                result.put(city.getId(), city);
            }
        }

        return result;
    }

    public Optional<Operator> getOperatorByUserId(String userId) {
        Operator cached = operatorCache.get(userId);
        if (cached != null) {
            return Optional.of(cached);
        }

        Optional<Operator> fromDb = operatorRepository.findByUserId(userId);
        fromDb.ifPresent(op -> operatorCache.put(userId, op));
        return fromDb;
    }

    public void evictOperator(String userId) {
        operatorCache.remove(userId);
    }
}
