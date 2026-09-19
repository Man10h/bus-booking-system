package com.Man10h.core_service.service;

import com.Man10h.core_service.model.entities.VehicleType;
import com.Man10h.core_service.model.enums.SeatType;
import com.Man10h.core_service.model.request.VehicleTypeFilter;
import com.Man10h.core_service.model.response.VehicleTypePageResponse;
import com.Man10h.core_service.model.response.VehicleTypeResponse;
import com.Man10h.core_service.repository.*;
import com.Man10h.core_service.service.impl.VehicleServiceImpl;
import com.Man10h.core_service.util.SeatGenerator;
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

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceImplTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private OperatorRepository operatorRepository;

    @Mock
    private VehicleTypeRepository vehicleTypeRepository;

    @Mock
    private SeatGenerator seatGenerator;

    @Mock
    private SeatRepository seatRepository;

    @Mock
    private ScheduleRepository scheduleRepository;

    @InjectMocks
    private VehicleServiceImpl vehicleService;

    private VehicleType createSampleVehicleType(Long id, String code, String name, SeatType seatType, int floors, int rows, int cols) {
        return VehicleType.builder()
                .id(id)
                .code(code)
                .name(name)
                .seatType(seatType)
                .floors(floors)
                .rows(rows)
                .cols(cols)
                .vehicles(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Should return paginated and filtered vehicle types")
    void findVehicleTypes_Success() {
        VehicleType vt = createSampleVehicleType(1L, "SLEEPER_2F", "Xe giuong nam 2 tang", SeatType.BED, 2, 6, 3);
        VehicleTypeFilter filter = new VehicleTypeFilter("giuong", "BED", 2);
        Pageable pageable = PageRequest.of(0, 10);
        Page<VehicleType> page = new PageImpl<>(List.of(vt), pageable, 1);

        when(vehicleTypeRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        VehicleTypePageResponse response = vehicleService.findVehicleTypes(filter, pageable);

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals(1, response.getContent().size());
        assertEquals("SLEEPER_2F", response.getContent().get(0).code());
        assertEquals(SeatType.BED, response.getContent().get(0).seatType());
        assertEquals(2, response.getContent().get(0).floors());
        verify(vehicleTypeRepository, times(1)).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    @DisplayName("Should return all vehicle types for dropdown selection")
    void getAllVehicleTypes_Success() {
        VehicleType vt1 = createSampleVehicleType(1L, "SEAT_45", "Xe ghe ngoi 45 cho", SeatType.SEAT, 1, 10, 4);
        VehicleType vt2 = createSampleVehicleType(2L, "SLEEPER_34", "Xe giuong nam 34 phong", SeatType.BED, 2, 6, 3);

        when(vehicleTypeRepository.findAll()).thenReturn(List.of(vt1, vt2));

        List<VehicleTypeResponse> list = vehicleService.getAllVehicleTypes();

        assertNotNull(list);
        assertEquals(2, list.size());
        verify(vehicleTypeRepository, times(1)).findAll();
    }
}
