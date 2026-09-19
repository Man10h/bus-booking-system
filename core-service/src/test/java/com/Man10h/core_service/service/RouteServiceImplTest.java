package com.Man10h.core_service.service;

import com.Man10h.core_service.model.entities.City;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.model.entities.Route;
import com.Man10h.core_service.model.enums.RouteStatus;
import com.Man10h.core_service.model.request.RouteFilter;
import com.Man10h.core_service.model.response.RoutePageResponse;
import com.Man10h.core_service.repository.*;
import com.Man10h.core_service.service.impl.RouteServiceImpl;
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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

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
}
