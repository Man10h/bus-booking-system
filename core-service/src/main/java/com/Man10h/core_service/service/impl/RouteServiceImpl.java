package com.Man10h.core_service.service.impl;

import com.Man10h.core_service.controller.exception.*;
import com.Man10h.core_service.model.entities.City;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.model.entities.Route;
import com.Man10h.core_service.model.entities.RouteStop;
import com.Man10h.core_service.model.enums.RouteStatus;
import com.Man10h.core_service.model.enums.ScheduleStatus;
import com.Man10h.core_service.model.request.*;
import com.Man10h.core_service.model.response.*;
import com.Man10h.core_service.repository.*;
import com.Man10h.core_service.service.RouteService;
import com.Man10h.core_service.util.TransactionalCacheEvictor;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

import static com.Man10h.core_service.repository.spec.RouteSpecification.*;

@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {
    private final RouteRepository routeRepository;
    private final OperatorRepository operatorRepository;
    private final CityRepository cityRepository;
    private final RouteStopRepository routeStopRepository;
    private final ScheduleRepository scheduleRepository;
    private final TransactionalCacheEvictor transactionalCacheEvictor;
    private final com.Man10h.core_service.service.MasterDataCacheService masterDataCacheService;
    private final StringRedisTemplate stringRedisTemplate;

    public RouteSummaryResponse toRouteSummaryResponse(Route route) {
        Operator operator = route.getOperator();
        OperatorResponse operatorResponse = new OperatorResponse(operator.getId(), operator.getCompanyName(), operator.getContactPhone(), operator.getTaxCode(), operator.getAvatarUrl());
        return new RouteSummaryResponse(
                route.getId(),
                route.getRouteCode(),
                route.getDistance(),
                route.getEstimatedDurationMinutes(),
                route.getStatus(),
                operatorResponse,
                route.getArrivalCity().getName(),
                route.getDepartureCity().getName()
        );
    }

    public RouteStopResponse toRouteStopResponse(RouteStop routeStop) {
        return new RouteStopResponse(
                routeStop.getId(),
                routeStop.getStopOrder(),
                routeStop.getStopName(),
                routeStop.getDistanceFromStart(),
                routeStop.getEstimatedArrivalOffsetMinutes(),
                routeStop.getIsPickup(),
                routeStop.getIsDropOff(),
                routeStop.getCity().getName()
        );
    }

    @Override
    @Cacheable(
            value = "routes",
            key = "T(com.Man10h.core_service.util.CacheKeyUtil).routeKey(#request, #pageable)"
    )
    public RoutePageResponse findRoutes(RouteFilter request, Pageable pageable) {
        Specification<Route> spec = Specification.allOf(
                departureCity(request.departureCityId()),
                arrivalCity(request.arrivalCityId()),
                operator(request.operatorId()),
                status(request.status())
        );
        Page<RouteSummaryResponse> page = routeRepository.findAll(spec, pageable)
                .map(this::toRouteSummaryResponse);

        return new RoutePageResponse(
                page.getContent(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
        );
    }

    @Override
    public RouteDetailResponse getRouteDetailById(Long id) {
        Optional<Route> optional = routeRepository.getDetailById(id);
        if(optional.isEmpty()){
            throw new RouteNotFoundException("Route not found");
        }
        Route route = optional.get();
        return toRouteDetailResponse(route);
    }

    private record StopValidationItem(
            Long id,
            Long stopOrder,
            String stopName,
            BigDecimal distanceFromStart,
            Long estimatedArrivalOffsetMinutes,
            Boolean isPickup,
            Boolean isDropOff,
            Long cityId
    ) {}

    private void validateRoute(Long departureCityId, Long arrivalCityId, BigDecimal distance, Long estimatedDurationMinutes) {
        if (departureCityId == null || arrivalCityId == null) {
            throw new IllegalArgumentException("Điểm đi và điểm đến không được để trống");
        }
        if (departureCityId.equals(arrivalCityId)) {
            throw new IllegalArgumentException("Điểm đi và điểm đến không được trùng nhau");
        }
        if (distance == null || distance.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Khoảng cách của tuyến phải lớn hơn 0");
        }
        if (estimatedDurationMinutes == null || estimatedDurationMinutes <= 0) {
            throw new IllegalArgumentException("Thời gian ước tính của tuyến phải lớn hơn 0");
        }
    }

    private void validateRouteStops(List<StopValidationItem> stops, BigDecimal totalDistance, Long totalEstimatedDuration) {
        if (stops == null || stops.isEmpty()) {
            throw new IllegalArgumentException("Danh sách trạm dừng không được để trống");
        }

        List<StopValidationItem> sortedStops = stops.stream()
                .sorted(Comparator.comparing(StopValidationItem::stopOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        Set<Long> stopOrders = new HashSet<>();
        BigDecimal lastDistance = BigDecimal.ZERO;
        Long lastOffset = 0L;
        boolean hasPickup = false;
        boolean hasDropOff = false;

        for (StopValidationItem stop : sortedStops) {
            if (stop.stopOrder() == null || stop.stopOrder() < 1) {
                throw new IllegalArgumentException("Thứ tự trạm dừng (stopOrder) phải lớn hơn hoặc bằng 1");
            }
            if (!stopOrders.add(stop.stopOrder())) {
                throw new IllegalArgumentException("Thứ tự trạm dừng (stopOrder) bị trùng lặp: " + stop.stopOrder());
            }
            if (stop.distanceFromStart() == null || stop.distanceFromStart().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Khoảng cách trạm dừng (distanceFromStart) không được âm");
            }
            if (stop.distanceFromStart().compareTo(lastDistance) < 0) {
                throw new IllegalArgumentException("Khoảng cách trạm dừng (distanceFromStart) phải tăng dần theo lộ trình");
            }
            lastDistance = stop.distanceFromStart();

            if (stop.estimatedArrivalOffsetMinutes() == null || stop.estimatedArrivalOffsetMinutes() < 0) {
                throw new IllegalArgumentException("Thời gian ước tính (estimatedArrivalOffsetMinutes) không được âm");
            }
            if (stop.estimatedArrivalOffsetMinutes() < lastOffset) {
                throw new IllegalArgumentException("Thời gian ước tính (estimatedArrivalOffsetMinutes) phải tăng dần theo lộ trình");
            }
            lastOffset = stop.estimatedArrivalOffsetMinutes();

            boolean isPickup = Boolean.TRUE.equals(stop.isPickup());
            boolean isDropOff = Boolean.TRUE.equals(stop.isDropOff());

            if (!isPickup && !isDropOff) {
                throw new IllegalArgumentException("Trạm dừng '" + stop.stopName() + "' phải là điểm đón hoặc điểm trả (hoặc cả hai)");
            }
            if (isPickup) hasPickup = true;
            if (isDropOff) hasDropOff = true;
        }

        if (!hasPickup) {
            throw new IllegalArgumentException("Tuyến đường phải có ít nhất 1 điểm đón (pickup)");
        }
        if (!hasDropOff) {
            throw new IllegalArgumentException("Tuyến đường phải có ít nhất 1 điểm trả (drop-off)");
        }

        if (totalDistance != null && lastDistance.compareTo(totalDistance) > 0) {
            throw new IllegalArgumentException("Khoảng cách trạm dừng cuối cùng không được vượt quá tổng khoảng cách của tuyến");
        }
        if (totalEstimatedDuration != null && lastOffset > totalEstimatedDuration) {
            throw new IllegalArgumentException("Thời gian trạm dừng cuối cùng không được vượt quá tổng thời gian của tuyến");
        }
    }

    public RouteDetailResponse toRouteDetailResponse(Route route) {
        List<RouteStopResponse> routeStopResponseList = new ArrayList<>();
        if (route.getRouteStopList() != null) {
            route.getRouteStopList().stream()
                    .sorted(Comparator.comparing(RouteStop::getStopOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                    .forEach(rs -> routeStopResponseList.add(toRouteStopResponse(rs)));
        }
        Operator operator = route.getOperator();
        OperatorResponse operatorResponse = new OperatorResponse(operator.getId(), operator.getCompanyName(), operator.getContactPhone(), operator.getTaxCode(), operator.getAvatarUrl());
        return new RouteDetailResponse(
                route.getId(),
                route.getRouteCode(),
                route.getDistance(),
                route.getEstimatedDurationMinutes(),
                route.getStatus(),
                operatorResponse,
                route.getArrivalCity().getName(),
                route.getDepartureCity().getName(),
                routeStopResponseList
        );
    }

    @Transactional
    public RouteDetailResponse createRoute(String userId, CreateRouteRequest request) {
        validateRoute(request.departureCityId(), request.arrivalCityId(), request.distance(), request.estimatedDurationMinutes());

        List<StopValidationItem> validationItems = request.routeStops().stream()
                .map(s -> new StopValidationItem(null, s.stopOrder(), s.stopName(), s.distanceFromStart(), s.estimatedArrivalOffsetMinutes(), s.isPickup(), s.isDropOff(), s.cityId()))
                .toList();
        validateRouteStops(validationItems, request.distance(), request.estimatedDurationMinutes());

        if(routeRepository.existsByRouteCode(request.routeCode())){
            throw new RouteCodeAlreadyExistsException("Route code already exists");
        }
        Optional<Operator> optionalOperator = masterDataCacheService.getOperatorByUserId(userId);
        if(optionalOperator.isEmpty()){
            throw new OperatorNotFoundException("Operator not found");
        }
        Operator operator = optionalOperator.get();

        // Batch fetch and validate all cities from in-memory cache / batch DB lookup
        Set<Long> requiredCityIds = new HashSet<>();
        requiredCityIds.add(request.departureCityId());
        requiredCityIds.add(request.arrivalCityId());
        for (CreateRouteStopRequest stop : request.routeStops()) {
            requiredCityIds.add(stop.cityId());
        }

        Map<Long, City> cityMap = masterDataCacheService.getCitiesByIds(requiredCityIds);
        if (cityMap.size() != requiredCityIds.size()) {
            throw new CityNotFoundException("Một hoặc nhiều thành phố/trạm dừng không tồn tại");
        }

        Route route = Route.builder()
                .arrivalCity(cityMap.get(request.arrivalCityId()))
                .departureCity(cityMap.get(request.departureCityId()))
                .operator(operator)
                .routeCode(request.routeCode())
                .distance(request.distance())
                .estimatedDurationMinutes(request.estimatedDurationMinutes())
                .routeStopList(new ArrayList<>())
                .status(RouteStatus.ACTIVE)
                .build();

        for(CreateRouteStopRequest createRouteStopRequest: request.routeStops()){
            RouteStop routeStop = RouteStop.builder()
                    .route(route)
                    .city(cityMap.get(createRouteStopRequest.cityId()))
                    .stopName(createRouteStopRequest.stopName())
                    .stopOrder(createRouteStopRequest.stopOrder())
                    .distanceFromStart(createRouteStopRequest.distanceFromStart())
                    .estimatedArrivalOffsetMinutes(createRouteStopRequest.estimatedArrivalOffsetMinutes())
                    .isPickup(createRouteStopRequest.isPickup())
                    .isDropOff(createRouteStopRequest.isDropOff())
                    .build();
            route.getRouteStopList().add(routeStop);
        }
        routeRepository.save(route);

        transactionalCacheEvictor.evictAfterCommit("routes");

        return toRouteDetailResponse(route);
    }

    @Transactional
    public RouteDetailResponse updateRoute(Long id, String userId, UpdateRouteRequest request) {
        String lockKey = "lock:route_schedule:" + id;
        String lockValue = UUID.randomUUID().toString();
        Boolean locked = stringRedisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockValue, Duration.ofSeconds(10));

        if (Boolean.FALSE.equals(locked)) {
            throw new IllegalStateException("Tuyến xe đang được xử lý bởi thao tác khác, vui lòng thử lại sau!");
        }

        try {
            Optional<Route> optional = routeRepository.getDetailById(id);
            if(optional.isEmpty()){
                throw new RouteNotFoundException("Route not found");
            }
            if(!optional.get().getOperator().getUserId().equals(userId)){
                throw new AccessDeniedException("You don't own this route");
            }
            if (scheduleRepository.existsByRoute_IdAndStatusIn(id, List.of(ScheduleStatus.OPEN, ScheduleStatus.RUNNING))) {
                throw new IllegalStateException("Không thể sửa đổi lộ trình của tuyến xe đang có chuyến chạy (OPEN hoặc RUNNING).");
            }

            validateRoute(request.departureCityId(), request.arrivalCityId(), request.distance(), request.estimatedDurationMinutes());

            List<StopValidationItem> validationItems = (request.routeStops() != null ? request.routeStops() : Collections.<UpdateRouteStopRequest>emptyList()).stream()
                    .map(s -> new StopValidationItem(s.id(), s.stopOrder(), s.stopName(), s.distanceFromStart(), s.estimatedArrivalOffsetMinutes(), s.isPickup(), s.isDropOff(), s.cityId()))
                    .toList();
            validateRouteStops(validationItems, request.distance(), request.estimatedDurationMinutes());

            if (routeRepository.existsByRouteCodeAndIdNot(request.routeCode(), id)) {
                throw new RouteCodeAlreadyExistsException("Route code already exists: " + request.routeCode());
            }

            Set<Long> requiredCityIds = new HashSet<>();
            requiredCityIds.add(request.departureCityId());
            requiredCityIds.add(request.arrivalCityId());
            if (request.routeStops() != null) {
                for (UpdateRouteStopRequest stop : request.routeStops()) {
                    requiredCityIds.add(stop.cityId());
                }
            }
            Map<Long, City> cityMap = masterDataCacheService.getCitiesByIds(requiredCityIds);
            if (!cityMap.containsKey(request.departureCityId())) {
                throw new CityNotFoundException("Departure City not found");
            }
            if (!cityMap.containsKey(request.arrivalCityId())) {
                throw new CityNotFoundException("Arrival City not found");
            }

            Route route = optional.get();
            route.setRouteCode(request.routeCode());
            route.setDistance(request.distance());
            route.setEstimatedDurationMinutes(request.estimatedDurationMinutes());
            route.setArrivalCity(cityMap.get(request.arrivalCityId()));
            route.setDepartureCity(cityMap.get(request.departureCityId()));

            Map<Long, RouteStop> existingStops = route.getRouteStopList().stream()
                    .collect(Collectors.toMap(RouteStop::getId, s -> s));

            Set<Long> updatedStopIds = request.routeStops() != null
                    ? request.routeStops().stream()
                    .map(UpdateRouteStopRequest::id)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet())
                    : Collections.emptySet();

            // 1. Remove stops that are not in the update request
            route.getRouteStopList().removeIf(s -> !updatedStopIds.contains(s.getId()));

            // 2. Update existing stops and add new stops
            if (request.routeStops() != null) {
                for (UpdateRouteStopRequest updateRouteStopRequest : request.routeStops()) {
                    City stopCity = cityMap.get(updateRouteStopRequest.cityId());
                    if (stopCity == null) {
                        throw new CityNotFoundException("City stop not found: " + updateRouteStopRequest.cityId());
                    }

                    if (updateRouteStopRequest.id() != null && existingStops.containsKey(updateRouteStopRequest.id())) {
                        RouteStop routeStop = existingStops.get(updateRouteStopRequest.id());
                        routeStop.setCity(stopCity);
                        routeStop.setStopName(updateRouteStopRequest.stopName());
                        routeStop.setStopOrder(updateRouteStopRequest.stopOrder());
                        routeStop.setDistanceFromStart(updateRouteStopRequest.distanceFromStart());
                        routeStop.setEstimatedArrivalOffsetMinutes(updateRouteStopRequest.estimatedArrivalOffsetMinutes());
                        routeStop.setIsPickup(updateRouteStopRequest.isPickup());
                        routeStop.setIsDropOff(updateRouteStopRequest.isDropOff());
                    } else {
                        RouteStop newStop = RouteStop.builder()
                                .route(route)
                                .city(stopCity)
                                .stopName(updateRouteStopRequest.stopName())
                                .stopOrder(updateRouteStopRequest.stopOrder())
                                .distanceFromStart(updateRouteStopRequest.distanceFromStart())
                                .estimatedArrivalOffsetMinutes(updateRouteStopRequest.estimatedArrivalOffsetMinutes())
                                .isPickup(updateRouteStopRequest.isPickup())
                                .isDropOff(updateRouteStopRequest.isDropOff())
                                .build();
                        route.getRouteStopList().add(newStop);
                    }
                }
            }

            routeRepository.save(route);

            transactionalCacheEvictor.evictAfterCommit("routes");

            return toRouteDetailResponse(route);
        } finally {
            String currentValue = stringRedisTemplate.opsForValue().get(lockKey);
            if (lockValue.equals(currentValue)) {
                stringRedisTemplate.delete(lockKey);
            }
        }
    }

    @Transactional
    public void deactivateRoute(String userId, Long id) {
        String lockKey = "lock:route_schedule:" + id;
        String lockValue = UUID.randomUUID().toString();
        Boolean locked = stringRedisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockValue, Duration.ofSeconds(10));

        if (Boolean.FALSE.equals(locked)) {
            throw new IllegalStateException("Tuyến xe đang được xử lý bởi thao tác khác, vui lòng thử lại sau!");
        }

        try {
            Optional<Route> optional = routeRepository.getDetailById(id);
            if(optional.isEmpty()){
                throw new RouteNotFoundException("Route not found");
            }
            if(!optional.get().getOperator().getUserId().equals(userId)){
                throw new AccessDeniedException("You don't own this route");
            }
            if(scheduleRepository.existsByRoute_IdAndStatusIn(id, List.of(ScheduleStatus.OPEN, ScheduleStatus.RUNNING))){
                throw new IllegalStateException("Không thể tạm dừng tuyến xe đang có chuyến mở bán hoặc đang chạy");
            }
            Route route = optional.get();
            if(route.getStatus() == RouteStatus.INACTIVE){
                return;
            }
            route.setStatus(RouteStatus.INACTIVE);

            routeRepository.save(route);

            transactionalCacheEvictor.evictAfterCommit("routes");
        } finally {
            String currentValue = stringRedisTemplate.opsForValue().get(lockKey);
            if (lockValue.equals(currentValue)) {
                stringRedisTemplate.delete(lockKey);
            }
        }
    }

    @Transactional
    public void activeRoute(String userId, Long id) {
        String lockKey = "lock:route_schedule:" + id;
        String lockValue = UUID.randomUUID().toString();
        Boolean locked = stringRedisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockValue, Duration.ofSeconds(10));

        if (Boolean.FALSE.equals(locked)) {
            throw new IllegalStateException("Tuyến xe đang được xử lý bởi thao tác khác, vui lòng thử lại sau!");
        }

        try {
            Optional<Route> optional = routeRepository.getDetailById(id);
            if(optional.isEmpty()){
                throw new RouteNotFoundException("Route not found");
            }
            if(!optional.get().getOperator().getUserId().equals(userId)){
                throw new AccessDeniedException("You don't own this route");
            }
            Route route = optional.get();
            if(route.getStatus() == RouteStatus.ACTIVE){
                return;
            }
            route.setStatus(RouteStatus.ACTIVE);
            routeRepository.save(route);

            transactionalCacheEvictor.evictAfterCommit("routes");
        } finally {
            String currentValue = stringRedisTemplate.opsForValue().get(lockKey);
            if (lockValue.equals(currentValue)) {
                stringRedisTemplate.delete(lockKey);
            }
        }
    }
}
