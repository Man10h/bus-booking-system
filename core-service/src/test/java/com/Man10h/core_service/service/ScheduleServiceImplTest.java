package com.Man10h.core_service.service;

import com.Man10h.core_service.model.entities.*;
import com.Man10h.core_service.model.enums.*;
import com.Man10h.core_service.model.request.ScheduleFilter;
import com.Man10h.core_service.model.response.SchedulePageResponse;
import com.Man10h.core_service.repository.*;
import com.Man10h.core_service.service.impl.ScheduleServiceImpl;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceImplTest {

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private ScheduleSeatRepository scheduleSeatRepository;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @Test
    @DisplayName("Should find schedules with pagination and filters")
    void findSchedules_Success() {
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

        VehicleType vt = VehicleType.builder()
                .id(1L)
                .code("SLEEPER")
                .name("Giuong nam")
                .seatType(SeatType.BED)
                .floors(2)
                .rows(6)
                .cols(3)
                .build();

        Vehicle vehicle = Vehicle.builder()
                .id(10L)
                .licensePlate("29B-12345")
                .brand("Thaco")
                .model("Mobihome")
                .totalSeats(36L)
                .status(VehicleStatus.ACTIVE)
                .operator(operator)
                .vehicleType(vt)
                .vehicleSeatList(new ArrayList<>())
                .build();

        Schedule schedule = Schedule.builder()
                .id(500L)
                .departureTime(LocalDateTime.of(2026, 7, 25, 8, 0))
                .arrivalTime(LocalDateTime.of(2026, 7, 25, 20, 0))
                .basePrice(new BigDecimal("350000"))
                .vipPrice(new BigDecimal("450000"))
                .availableSeats(20L)
                .totalSeats(36L)
                .operatorId("op-1")
                .status(ScheduleStatus.OPEN)
                .route(route)
                .vehicle(vehicle)
                .build();

        // ScheduleFilter: String operatorId, Long routeId, Long departureCityId, Long arrivalCityId, LocalDateTime departureTime, LocalDateTime arrivalTime, Long vehicleTypeId, String status
        ScheduleFilter filter = new ScheduleFilter("op-1", null, 1L, 2L, null, null, null, "OPEN");
        Pageable pageable = PageRequest.of(0, 10);
        Page<Schedule> schedulePage = new PageImpl<>(List.of(schedule), pageable, 1);

        when(scheduleRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(schedulePage);

        SchedulePageResponse response = scheduleService.findSchedules(filter, pageable);

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals(1, response.getContent().size());
        assertEquals(500L, response.getContent().get(0).id());
        assertEquals(ScheduleStatus.OPEN, response.getContent().get(0).status());
        assertEquals(20L, response.getContent().get(0).availableSeats());

        verify(scheduleRepository, times(1)).findAll(any(Specification.class), eq(pageable));
    }
}
