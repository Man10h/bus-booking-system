package com.Man10h.core_service.service;

import com.Man10h.core_service.model.entities.City;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.model.entities.VehicleType;
import com.Man10h.core_service.repository.CityRepository;
import com.Man10h.core_service.repository.OperatorRepository;
import com.Man10h.core_service.repository.VehicleTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class MasterDataCacheService {

    private final CityRepository cityRepository;
    private final OperatorRepository operatorRepository;
    private final VehicleTypeRepository vehicleTypeRepository;

    private final Map<Long, City> cityCache = new ConcurrentHashMap<>();
    private final Map<String, Operator> operatorCache = new ConcurrentHashMap<>();
    private final Map<Long, VehicleType> vehicleTypeCache = new ConcurrentHashMap<>();

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

        try {
            List<VehicleType> vehicleTypes = vehicleTypeRepository.findAll();
            for (VehicleType vt : vehicleTypes) {
                vehicleTypeCache.put(vt.getId(), vt);
            }
            log.info("MasterDataCacheService: Preloaded {} vehicle types into in-memory cache", vehicleTypeCache.size());
        } catch (Exception e) {
            log.warn("MasterDataCacheService: Could not preload vehicle types during startup: {}", e.getMessage());
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

    public Optional<VehicleType> getVehicleTypeById(Long vehicleTypeId) {
        VehicleType cached = vehicleTypeCache.get(vehicleTypeId);
        if (cached != null) {
            return Optional.of(cached);
        }

        Optional<VehicleType> fromDb = vehicleTypeRepository.findById(vehicleTypeId);
        fromDb.ifPresent(vt -> vehicleTypeCache.put(vehicleTypeId, vt));
        return fromDb;
    }

    public void evictVehicleType(Long vehicleTypeId) {
        if (vehicleTypeId != null) {
            vehicleTypeCache.remove(vehicleTypeId);
        } else {
            vehicleTypeCache.clear();
        }
    }
}
