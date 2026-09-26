package com.Man10h.core_service.service;

import com.Man10h.core_service.controller.exception.RouteCodeAlreadyExistsException;
import com.Man10h.core_service.model.entities.City;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.model.entities.Route;
import com.Man10h.core_service.model.entities.RouteStop;
import com.Man10h.core_service.model.enums.RouteStatus;
import com.Man10h.core_service.model.enums.ScheduleStatus;
import com.Man10h.core_service.model.request.CreateRouteRequest;
import com.Man10h.core_service.model.request.CreateRouteStopRequest;
import com.Man10h.core_service.model.request.RouteFilter;
import com.Man10h.core_service.model.request.UpdateRouteRequest;
import com.Man10h.core_service.model.request.UpdateRouteStopRequest;
import com.Man10h.core_service.model.response.RouteDetailResponse;
import com.Man10h.core_service.model.response.RoutePageResponse;
import com.Man10h.core_service.repository.*;
import com.Man10h.core_service.service.MasterDataCacheService;
import com.Man10h.core_service.service.impl.RouteServiceImpl;
import com.Man10h.core_service.util.TransactionalCacheEvictor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RouteServiceImplTest {

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private OperatorRepository operatorRepository;

    @Mock
    private CityRepository cityRepository;

    @Mock
    private RouteStopRepository routeStopRepository;

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private TransactionalCacheEvictor transactionalCacheEvictor;

    @Mock
    private MasterDataCacheService masterDataCacheService;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private RouteServiceImpl routeService;

    @Test
    @DisplayName("Should find routes with pagination and filters using allOf specification")
    void findRoutes_Success() {
        City depCity = City.builder().id(1L).name("Ha Noi").code("HN").build();
        City arrCity = City.builder().id(2L).name("Da Nang").code("DN").build();
        Operator operator = new Operator("op-1", "user-1", "Phuong Trang", "0123456789", "0901234567", "avatar.jpg", null, null);

        Route route = Route.builder()
                .id(100L)
                .routeCode("HN-DN-01")
                .departureCity(depCity)
                .arrivalCity(arrCity)
                .distance(new BigDecimal("750.00"))
                .estimatedDurationMinutes(840L)
                .status(RouteStatus.ACTIVE)
                .operator(operator)
                .routeStopList(new ArrayList<>())
                .build();

        RouteFilter filter = new RouteFilter(1L, 2L, "op-1", "ACTIVE");
        Pageable pageable = PageRequest.of(0, 10);
        Page<Route> routePage = new PageImpl<>(List.of(route), pageable, 1);

        when(routeRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(routePage);

        RoutePageResponse response = routeService.findRoutes(filter, pageable);

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals(1, response.getContent().size());
        assertEquals("HN-DN-01", response.getContent().get(0).routeCode());
        assertEquals("Ha Noi", response.getContent().get(0).departureCityName());
        assertEquals("Da Nang", response.getContent().get(0).arrivalCityName());

        verify(routeRepository, times(1)).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    @DisplayName("Create route should succeed with valid data and stops")
    void createRoute_Success() {
        City depCity = City.builder().id(1L).name("Ha Noi").code("HN").build();
        City arrCity = City.builder().id(2L).name("Da Nang").code("DN").build();
        Operator operator = new Operator("op-1", "user-1", "Phuong Trang", "0123456789", "0901234567", "avatar.jpg", null, null);

        List<CreateRouteStopRequest> stops = List.of(
                new CreateRouteStopRequest(1L, "Ha Noi Station", BigDecimal.ZERO, 0L, true, false, 1L),
                new CreateRouteStopRequest(2L, "Da Nang Station", new BigDecimal("750.00"), 840L, false, true, 2L)
        );
        CreateRouteRequest request = new CreateRouteRequest("HN-DN-01", 1L, 2L, new BigDecimal("750.00"), 840L, stops);

        when(routeRepository.existsByRouteCode("HN-DN-01")).thenReturn(false);
        when(masterDataCacheService.getOperatorByUserId("user-1")).thenReturn(Optional.of(operator));
        when(masterDataCacheService.getCitiesByIds(Set.of(1L, 2L))).thenReturn(Map.of(1L, depCity, 2L, arrCity));
        when(routeRepository.save(any(Route.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RouteDetailResponse response = routeService.createRoute("user-1", request);

        assertNotNull(response);
        assertEquals("HN-DN-01", response.routeCode());
        assertEquals(2, response.routeStopResponse().size());
        verify(routeRepository).save(any(Route.class));
        verify(transactionalCacheEvictor).evictAfterCommit("routes");
    }

    @Test
    @DisplayName("Create route with same departure and arrival city should throw IllegalArgumentException")
    void createRoute_SameDepartureAndArrival_ThrowsException() {
        List<CreateRouteStopRequest> stops = List.of(
                new CreateRouteStopRequest(1L, "Ha Noi Station", BigDecimal.ZERO, 0L, true, true, 1L)
        );
        CreateRouteRequest request = new CreateRouteRequest("HN-HN-01", 1L, 1L, new BigDecimal("10.00"), 30L, stops);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                routeService.createRoute("user-1", request)
        );
        assertEquals("Điểm đi và điểm đến không được trùng nhau", exception.getMessage());
    }

    @Test
    @DisplayName("Create route with invalid stop (neither pickup nor drop-off) should throw IllegalArgumentException")
    void createRoute_StopNeitherPickupNorDropOff_ThrowsException() {
        List<CreateRouteStopRequest> stops = List.of(
                new CreateRouteStopRequest(1L, "Ha Noi Station", BigDecimal.ZERO, 0L, true, false, 1L),
                new CreateRouteStopRequest(2L, "Mid Stop", new BigDecimal("300.00"), 300L, false, false, 1L),
                new CreateRouteStopRequest(3L, "Da Nang Station", new BigDecimal("750.00"), 840L, false, true, 2L)
        );
        CreateRouteRequest request = new CreateRouteRequest("HN-DN-01", 1L, 2L, new BigDecimal("750.00"), 840L, stops);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                routeService.createRoute("user-1", request)
        );
        assertTrue(exception.getMessage().contains("phải là điểm đón hoặc điểm trả"));
    }

    @Test
    @DisplayName("Update route should update existing stops, remove deleted stops, and add new stops")
    void updateRoute_AddAndRemoveStops_Success() {
        City depCity = City.builder().id(1L).name("Ha Noi").code("HN").build();
        City midCity = City.builder().id(3L).name("Hue").code("HUE").build();
        City arrCity = City.builder().id(2L).name("Da Nang").code("DN").build();
        Operator operator = new Operator("op-1", "user-1", "Phuong Trang", "0123456789", "0901234567", "avatar.jpg", null, null);

        Route existingRoute = Route.builder()
                .id(100L)
                .routeCode("HN-DN-01")
                .departureCity(depCity)
                .arrivalCity(arrCity)
                .distance(new BigDecimal("750.00"))
                .estimatedDurationMinutes(840L)
                .status(RouteStatus.ACTIVE)
                .operator(operator)
                .routeStopList(new ArrayList<>())
                .build();

        RouteStop stop1 = RouteStop.builder().id(10L).stopOrder(1L).stopName("Old Stop 1").distanceFromStart(BigDecimal.ZERO).estimatedArrivalOffsetMinutes(0L).isPickup(true).isDropOff(false).city(depCity).route(existingRoute).build();
        RouteStop stop2 = RouteStop.builder().id(20L).stopOrder(2L).stopName("Old Stop 2").distanceFromStart(new BigDecimal("750.00")).estimatedArrivalOffsetMinutes(840L).isPickup(false).isDropOff(true).city(arrCity).route(existingRoute).build();
        existingRoute.getRouteStopList().add(stop1);
        existingRoute.getRouteStopList().add(stop2);

        // Update request: keep stop 1 (modify it), remove stop 2, add new stop 3 (id is null), and add stop 4 (id is null)
        List<UpdateRouteStopRequest> updateStops = List.of(
                new UpdateRouteStopRequest(10L, 1L, "Ha Noi Central", BigDecimal.ZERO, 0L, true, false, 1L),
                new UpdateRouteStopRequest(null, 2L, "Hue Station", new BigDecimal("600.00"), 650L, true, true, 3L),
                new UpdateRouteStopRequest(null, 3L, "Da Nang Central", new BigDecimal("750.00"), 840L, false, true, 2L)
        );
        UpdateRouteRequest request = new UpdateRouteRequest("HN-DN-NEW", 1L, 2L, new BigDecimal("750.00"), 840L, updateStops);

        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("lock:route_schedule:100"), anyString(), eq(Duration.ofSeconds(10)))).thenReturn(true);
        when(valueOperations.get(eq("lock:route_schedule:100"))).thenAnswer(invocation -> null);
        when(routeRepository.getDetailById(100L)).thenReturn(Optional.of(existingRoute));
        when(scheduleRepository.existsByRoute_IdAndStatusIn(100L, List.of(ScheduleStatus.OPEN, ScheduleStatus.RUNNING))).thenReturn(false);
        when(routeRepository.existsByRouteCodeAndIdNot("HN-DN-NEW", 100L)).thenReturn(false);
        when(masterDataCacheService.getCitiesByIds(anySet())).thenReturn(Map.of(1L, depCity, 2L, arrCity, 3L, midCity));
        when(routeRepository.save(any(Route.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RouteDetailResponse response = routeService.updateRoute(100L, "user-1", request);

        assertNotNull(response);
        assertEquals("HN-DN-NEW", response.routeCode());
        assertEquals(3, response.routeStopResponse().size());
        assertEquals("Ha Noi Central", response.routeStopResponse().get(0).stopName());
        assertEquals("Hue Station", response.routeStopResponse().get(1).stopName());
        assertEquals("Da Nang Central", response.routeStopResponse().get(2).stopName());

        verify(routeRepository).save(existingRoute);
        verify(transactionalCacheEvictor).evictAfterCommit("routes");
    }

    @Test
    @DisplayName("Update route with duplicate route code from another route should throw RouteCodeAlreadyExistsException")
    void updateRoute_DuplicateRouteCode_ThrowsException() {
        City depCity = City.builder().id(1L).name("Ha Noi").code("HN").build();
        City arrCity = City.builder().id(2L).name("Da Nang").code("DN").build();
        Operator operator = new Operator("op-1", "user-1", "Phuong Trang", "0123456789", "0901234567", "avatar.jpg", null, null);

        Route existingRoute = Route.builder()
                .id(100L)
                .routeCode("HN-DN-01")
                .departureCity(depCity)
                .arrivalCity(arrCity)
                .distance(new BigDecimal("750.00"))
                .estimatedDurationMinutes(840L)
                .status(RouteStatus.ACTIVE)
                .operator(operator)
                .routeStopList(new ArrayList<>())
                .build();

        List<UpdateRouteStopRequest> updateStops = List.of(
                new UpdateRouteStopRequest(10L, 1L, "Ha Noi Central", BigDecimal.ZERO, 0L, true, false, 1L),
                new UpdateRouteStopRequest(null, 2L, "Da Nang Central", new BigDecimal("750.00"), 840L, false, true, 2L)
        );
        UpdateRouteRequest request = new UpdateRouteRequest("DUPLICATE-CODE", 1L, 2L, new BigDecimal("750.00"), 840L, updateStops);

        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("lock:route_schedule:100"), anyString(), eq(Duration.ofSeconds(10)))).thenReturn(true);
        when(valueOperations.get(eq("lock:route_schedule:100"))).thenAnswer(invocation -> null);
        when(routeRepository.getDetailById(100L)).thenReturn(Optional.of(existingRoute));
        when(scheduleRepository.existsByRoute_IdAndStatusIn(100L, List.of(ScheduleStatus.OPEN, ScheduleStatus.RUNNING))).thenReturn(false);
        when(routeRepository.existsByRouteCodeAndIdNot("DUPLICATE-CODE", 100L)).thenReturn(true);

        assertThrows(RouteCodeAlreadyExistsException.class, () ->
                routeService.updateRoute(100L, "user-1", request)
        );
    }
}
