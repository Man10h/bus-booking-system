package com.Man10h.core_service.service.impl;

import com.Man10h.core_service.controller.exception.*;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.model.entities.Route;
import com.Man10h.core_service.model.entities.RouteStop;
import com.Man10h.core_service.model.enums.RouteStatus;
import com.Man10h.core_service.model.enums.ScheduleStatus;
import com.Man10h.core_service.model.request.*;
import com.Man10h.core_service.model.response.*;
import com.Man10h.core_service.repository.*;
import com.Man10h.core_service.service.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.*;

import static com.Man10h.core_service.repository.spec.RouteSpecification.*;

@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {
    private final RouteRepository routeRepository;
    private final OperatorRepository operatorRepository;
    private final CityRepository cityRepository;
    private final RouteStopRepository routeStopRepository;
    private final ScheduleRepository scheduleRepository;

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

    public RouteDetailResponse toRouteDetailResponse(Route route) {
        List<RouteStopResponse> routeStopResponseList = new ArrayList<>();
        for(RouteStop rs: route.getRouteStopList()){
            routeStopResponseList.add(toRouteStopResponse(rs));
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


    //cache: redis not support record => that's why the value in redis miss main @class. But the record object in class still can deserialize because it declares the field
    @Override
    @Cacheable(
            value = "routes",
            key = "T(com.Man10h.core_service.util.CacheKeyUtil).routeKey(#request, #pageable)"
    )
    public RoutePageResponse findRoutes(RouteFilter request, Pageable pageable) {
        Specification<Route> spec = Specification.anyOf(
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

    @Transactional
    @CacheEvict(value = "routes", allEntries = true)
    public RouteDetailResponse createRoute(String userId, CreateRouteRequest request) {
        if(routeRepository.existsByRouteCode(request.routeCode())){
            throw new RouteCodeAlreadyExistsException("Route code already exists");
        }
        Optional<Operator> optionalOperator = operatorRepository.findByUserId(userId);
        if(optionalOperator.isEmpty()){
            throw new OperatorNotFoundException("Operator not found");
        }
        Operator operator = optionalOperator.get();
        if(!cityRepository.existsById(request.arrivalCityId())){
            throw new CityNotFoundException("Arrival City not found");
        }
        if(!cityRepository.existsById(request.departureCityId())){
            throw new CityNotFoundException("Departure City not found");
        }

        Route route = Route.builder()
                .arrivalCity(cityRepository.getReferenceById(request.arrivalCityId()))
                .departureCity(cityRepository.getReferenceById(request.departureCityId()))
                .operator(operator)
                .routeCode(request.routeCode())
                .distance(request.distance())
                .estimatedDurationMinutes(request.estimatedDurationMinutes())
                .routeStopList(new ArrayList<>())
                .status(RouteStatus.ACTIVE)
                .build();


        for(CreateRouteStopRequest createRouteStopRequest: request.routeStops()){
            if(!cityRepository.existsById(createRouteStopRequest.cityId())){
                throw new CityNotFoundException("City stop not found");
            }
            RouteStop routeStop = RouteStop.builder()
                    .route(route)
                    .city(cityRepository.getReferenceById(createRouteStopRequest.cityId()))
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

        return toRouteDetailResponse(route);
    }

    @Transactional
    @CacheEvict(value = "routes", allEntries = true)
    public RouteDetailResponse updateRoute(Long id, String userId, UpdateRouteRequest request) {
        Optional<Route> optional = routeRepository.getDetailById(id);
        if(optional.isEmpty()){
            throw new RouteNotFoundException("Route not found");
        }
        if(!optional.get().getOperator().getUserId().equals(userId)){
            throw new AccessDeniedException("You don't own this route");
        }
        if(!cityRepository.existsById(request.arrivalCityId())){
            throw new CityNotFoundException("Arrival City not found");
        }
        if(!cityRepository.existsById(request.departureCityId())){
            throw new CityNotFoundException("Departure City not found");
        }
        Route route = optional.get();
        route.setRouteCode(request.routeCode());
        route.setDistance(request.distance());
        route.setEstimatedDurationMinutes(request.estimatedDurationMinutes());
        route.setArrivalCity(cityRepository.getReferenceById(request.arrivalCityId()));
        route.setDepartureCity(cityRepository.getReferenceById(request.departureCityId()));

        for(UpdateRouteStopRequest updateRouteStopRequest: request.routeStops()){
            Optional<RouteStop> optionalRouteStop = routeStopRepository.findById(updateRouteStopRequest.id());
            if(optionalRouteStop.isEmpty()){
                throw new RouteStopNotFoundException("Route stop not found");
            }
            RouteStop routeStop = optionalRouteStop.get();
            if(!cityRepository.existsById(updateRouteStopRequest.cityId())){
                throw new CityNotFoundException("City stop not found");
            }
            routeStop.setCity(cityRepository.getReferenceById(updateRouteStopRequest.cityId()));
            routeStop.setStopName(updateRouteStopRequest.stopName());
            routeStop.setStopOrder(updateRouteStopRequest.stopOrder());
            routeStop.setDistanceFromStart(updateRouteStopRequest.distanceFromStart());
            routeStop.setEstimatedArrivalOffsetMinutes(updateRouteStopRequest.estimatedArrivalOffsetMinutes());
            routeStop.setIsPickup(updateRouteStopRequest.isPickup());
            routeStop.setIsDropOff(updateRouteStopRequest.isDropOff());

        }
        routeRepository.save(route);
        return toRouteDetailResponse(route);
    }

    @Transactional
    @CacheEvict(value = "routes", allEntries = true)
    public void deactivateRoute(String userId, Long id) {
        Optional<Route> optional = routeRepository.getDetailById(id);
        if(optional.isEmpty()){
            throw new RouteNotFoundException("Route not found");
        }
        if(!optional.get().getOperator().getUserId().equals(userId)){
            throw new AccessDeniedException("You don't own this route");
        }
        if(scheduleRepository.existsByRoute_IdAndStatusIn(id, List.of(ScheduleStatus.OPEN, ScheduleStatus.RUNNING))){
            throw new IllegalStateException("Schedule is already open or running");
        }
        Route route = optional.get();
        if(route.getStatus() == RouteStatus.INACTIVE){
            return;
        }
        route.setStatus(RouteStatus.INACTIVE);

        routeRepository.save(route);
    }

    @Transactional
    @CacheEvict(value = "routes", allEntries = true)
    public void activeRoute(String userId, Long id) {
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
    }
}
