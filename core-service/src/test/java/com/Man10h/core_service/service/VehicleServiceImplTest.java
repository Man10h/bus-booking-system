package com.Man10h.core_service.service;

import com.Man10h.core_service.controller.exception.*;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.model.entities.ScheduleSeat;
import com.Man10h.core_service.model.entities.Seat;
import com.Man10h.core_service.model.entities.Vehicle;
import com.Man10h.core_service.model.entities.VehicleType;
import com.Man10h.core_service.model.enums.ScheduleSeatStatus;
import com.Man10h.core_service.model.enums.SeatStatus;
import com.Man10h.core_service.model.enums.SeatType;
import com.Man10h.core_service.model.enums.VehicleStatus;
import com.Man10h.core_service.model.request.CreateVehicleRequest;
import com.Man10h.core_service.model.request.UpdateVehicleRequest;
import com.Man10h.core_service.model.request.VehicleTypeFilter;
import com.Man10h.core_service.model.response.VehicleResponse;
import com.Man10h.core_service.model.response.VehicleTypePageResponse;
import com.Man10h.core_service.model.response.VehicleTypeResponse;
import com.Man10h.core_service.repository.*;
import com.Man10h.core_service.service.impl.VehicleServiceImpl;
import com.Man10h.core_service.util.SeatGenerator;
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
import com.Man10h.core_service.controller.exception.AccessDeniedException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    @Mock
    private ScheduleSeatRepository scheduleSeatRepository;

    @Mock
    private MasterDataCacheService masterDataCacheService;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private TransactionalCacheEvictor transactionalCacheEvictor;

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

    private Operator createSampleOperator(String id, String userId) {
        return Operator.builder()
                .id(id)
                .userId(userId)
                .companyName("Nha Xe A")
                .taxCode("0123456789")
                .contactPhone("0987654321")
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

    @Test
    @DisplayName("Should create vehicle and generate seats successfully")
    void createVehicle_Success() {
        String userId = "user-123";
        CreateVehicleRequest request =
                new CreateVehicleRequest("29B-12345", "Thaco", "Mobihome", 34L, "Xe giuong nam", 1L);

        Operator operator = createSampleOperator("op-1", userId);
        VehicleType vt = createSampleVehicleType(1L, "SLEEPER_34", "Xe giuong nam 34", SeatType.BED, 2, 6, 3);

        when(vehicleRepository.existsByLicensePlate("29B-12345")).thenReturn(false);
        when(masterDataCacheService.getOperatorByUserId(userId)).thenReturn(Optional.of(operator));
        when(masterDataCacheService.getVehicleTypeById(1L)).thenReturn(Optional.of(vt));
        when(seatGenerator.generate(vt)).thenReturn(new ArrayList<>());
        when(vehicleRepository.save(any(Vehicle.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        VehicleResponse response = vehicleService.createVehicle(userId, request);

        assertNotNull(response);
        assertEquals("29B-12345", response.licensePlate());
        assertEquals("Thaco", response.brand());
        assertEquals(36L, response.totalSeats()); // 2 * 6 * 3 = 36
        verify(vehicleRepository, times(1)).save(any(Vehicle.class));
    }

    @Test
    @DisplayName("Should throw LicensePlateAlreadyExistsException when license plate already exists")
    void createVehicle_DuplicateLicensePlate_ThrowsException() {
        String userId = "user-123";
        CreateVehicleRequest request =
                new CreateVehicleRequest(" 29B-12345 ", "Thaco", "Mobihome", 34L, "Xe giuong nam", 1L);

        when(vehicleRepository.existsByLicensePlate("29B-12345")).thenReturn(true);

        assertThrows(LicensePlateAlreadyExistsException.class, () -> {
            vehicleService.createVehicle(userId, request);
        });

        verify(vehicleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should update vehicle details successfully when vehicle type remains unchanged")
    void updateVehicle_Success_SameVehicleType() {
        Long vehicleId = 10L;
        String userId = "user-123";
        UpdateVehicleRequest request = new UpdateVehicleRequest(" 29B-99999 ", "Hyundai", "Universe", 40L, "Xe chat luong cao", 1L);

        Operator operator = createSampleOperator("op-1", userId);
        VehicleType vt = createSampleVehicleType(1L, "SLEEPER_34", "Xe giuong nam 34", SeatType.BED, 2, 6, 3);
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .licensePlate("29B-11111")
                .brand("Thaco")
                .model("Mobihome")
                .description("Mo ta cu")
                .totalSeats(36L)
                .status(VehicleStatus.ACTIVE)
                .operator(operator)
                .vehicleType(vt)
                .vehicleSeatList(new ArrayList<>())
                .build();

        when(vehicleRepository.existsByLicensePlateAndIdNot("29B-99999", vehicleId)).thenReturn(false);
        when(vehicleTypeRepository.existsById(1L)).thenReturn(true);
        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));

        vehicleService.updateVehicle(vehicleId, userId, request);

        assertEquals("29B-99999", vehicle.getLicensePlate());
        assertEquals("Hyundai", vehicle.getBrand());
        assertEquals("Universe", vehicle.getModel());
        assertEquals("Xe chat luong cao", vehicle.getDescription());
        assertEquals(40L, vehicle.getTotalSeats());
        verify(vehicleRepository, times(1)).save(vehicle);
        verify(transactionalCacheEvictor, times(1)).evictAfterCommit("vehicles");
        verify(stringRedisTemplate, never()).opsForValue(); // No lock needed when type unchanged
    }

    @Test
    @DisplayName("Should update vehicle and regenerate seats when changing vehicle type with no active schedules")
    void updateVehicle_Success_ChangeVehicleType() {
        Long vehicleId = 10L;
        String userId = "user-123";
        UpdateVehicleRequest request = new UpdateVehicleRequest("29B-99999", "Hyundai", "Universe", 0L, "Xe moi", 2L);

        Operator operator = createSampleOperator("op-1", userId);
        VehicleType oldVt = createSampleVehicleType(1L, "OLD_TYPE", "Loai cu", SeatType.BED, 2, 6, 3);
        VehicleType newVt = createSampleVehicleType(2L, "NEW_TYPE", "Loai moi", SeatType.SEAT, 1, 10, 4);

        List<Seat> oldSeats = new ArrayList<>(List.of(
                Seat.builder().id(100L).seatNumber("01").build()
        ));
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .licensePlate("29B-11111")
                .operator(operator)
                .vehicleType(oldVt)
                .vehicleSeatList(oldSeats)
                .build();

        List<Seat> newSeats = List.of(
                Seat.builder().seatNumber("01").build(),
                Seat.builder().seatNumber("02").build()
        );

        when(vehicleRepository.existsByLicensePlateAndIdNot("29B-99999", vehicleId)).thenReturn(false);
        when(vehicleTypeRepository.existsById(2L)).thenReturn(true);
        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent("lock:vehicle_schedule:10", "LOCKED", Duration.ofSeconds(5))).thenReturn(true);
        when(scheduleRepository.existsByVehicle_IdAndStatusIn(eq(vehicleId), any())).thenReturn(false);
        when(vehicleTypeRepository.findById(2L)).thenReturn(Optional.of(newVt));
        when(seatGenerator.generate(newVt)).thenReturn(new ArrayList<>(newSeats));

        vehicleService.updateVehicle(vehicleId, userId, request);

        assertEquals(2L, vehicle.getVehicleType().getId());
        assertEquals(40L, vehicle.getTotalSeats()); // 1 * 10 * 4 = 40
        assertEquals(2, vehicle.getVehicleSeatList().size());
        verify(vehicleRepository, times(1)).save(vehicle);
        verify(transactionalCacheEvictor, times(1)).evictAfterCommit("vehicles");
        verify(stringRedisTemplate, times(1)).delete("lock:vehicle_schedule:10"); // Released lock
    }

    @Test
    @DisplayName("Should throw IllegalStateException when Redis lock cannot be acquired during vehicle type change")
    void updateVehicle_Fail_RedisLockConflict() {
        Long vehicleId = 10L;
        String userId = "user-123";
        UpdateVehicleRequest request = new UpdateVehicleRequest("29B-99999", "Hyundai", "Universe", 0L, "Xe moi", 2L);

        Operator operator = createSampleOperator("op-1", userId);
        VehicleType oldVt = createSampleVehicleType(1L, "OLD_TYPE", "Loai cu", SeatType.BED, 2, 6, 3);
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .licensePlate("29B-11111")
                .operator(operator)
                .vehicleType(oldVt)
                .vehicleSeatList(new ArrayList<>())
                .build();

        when(vehicleRepository.existsByLicensePlateAndIdNot("29B-99999", vehicleId)).thenReturn(false);
        when(vehicleTypeRepository.existsById(2L)).thenReturn(true);
        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent("lock:vehicle_schedule:10", "LOCKED", Duration.ofSeconds(5))).thenReturn(false);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            vehicleService.updateVehicle(vehicleId, userId, request);
        });

        assertTrue(ex.getMessage().contains("Xe đang được xếp lịch hoặc xử lý bởi thao tác khác"));
        verify(vehicleRepository, never()).save(any());
        verify(stringRedisTemplate, never()).delete("lock:vehicle_schedule:10");
    }

    @Test
    @DisplayName("Should throw IllegalStateException and release lock when active schedules exist")
    void updateVehicle_Fail_ActiveSchedulesExist() {
        Long vehicleId = 10L;
        String userId = "user-123";
        UpdateVehicleRequest request = new UpdateVehicleRequest("29B-99999", "Hyundai", "Universe", 0L, "Xe moi", 2L);

        Operator operator = createSampleOperator("op-1", userId);
        VehicleType oldVt = createSampleVehicleType(1L, "OLD_TYPE", "Loai cu", SeatType.BED, 2, 6, 3);
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .licensePlate("29B-11111")
                .operator(operator)
                .vehicleType(oldVt)
                .vehicleSeatList(new ArrayList<>())
                .build();

        when(vehicleRepository.existsByLicensePlateAndIdNot("29B-99999", vehicleId)).thenReturn(false);
        when(vehicleTypeRepository.existsById(2L)).thenReturn(true);
        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent("lock:vehicle_schedule:10", "LOCKED", Duration.ofSeconds(5))).thenReturn(true);
        when(scheduleRepository.existsByVehicle_IdAndStatusIn(eq(vehicleId), any())).thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            vehicleService.updateVehicle(vehicleId, userId, request);
        });

        assertTrue(ex.getMessage().contains("Cannot change vehicle type because the vehicle has active schedules"));
        verify(vehicleRepository, never()).save(any());
        verify(stringRedisTemplate, times(1)).delete("lock:vehicle_schedule:10"); // Released in finally
    }

    @Test
    @DisplayName("Should throw AccessDeniedException when updating vehicle not owned by operator")
    void updateVehicle_Fail_NotOwner() {
        Long vehicleId = 10L;
        String userId = "user-123";
        UpdateVehicleRequest request = new UpdateVehicleRequest("29B-99999", "Hyundai", "Universe", 0L, "Xe moi", 1L);

        Operator otherOperator = createSampleOperator("op-2", "other-user");
        VehicleType vt = createSampleVehicleType(1L, "TYPE_1", "Loai 1", SeatType.BED, 2, 6, 3);
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .operator(otherOperator)
                .vehicleType(vt)
                .build();

        when(vehicleRepository.existsByLicensePlateAndIdNot("29B-99999", vehicleId)).thenReturn(false);
        when(vehicleTypeRepository.existsById(1L)).thenReturn(true);
        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));

        assertThrows(AccessDeniedException.class, () -> {
            vehicleService.updateVehicle(vehicleId, userId, request);
        });

        verify(vehicleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should update seat status to INACTIVE and cascade block schedule seats when all are AVAILABLE")
    void updateSeatStatus_ToInactive_Success() {
        Long seatId = 1L;
        String userId = "user-123";
        Seat seat = Seat.builder()
                .id(seatId)
                .status(SeatStatus.ACTIVE)
                .build();

        ScheduleSeat ss1 = ScheduleSeat.builder().id(101L).status(ScheduleSeatStatus.AVAILABLE).build();
        ScheduleSeat ss2 = ScheduleSeat.builder().id(102L).status(ScheduleSeatStatus.AVAILABLE).build();

        when(seatRepository.findByIdAndVehicle_Operator_UserId(seatId, userId)).thenReturn(Optional.of(seat));
        when(scheduleSeatRepository.findAllBySeatIdForUpdate(seatId)).thenReturn(List.of(ss1, ss2));

        vehicleService.updateSeatStatus(seatId, userId, "INACTIVE");

        assertEquals(SeatStatus.INACTIVE, seat.getStatus());
        verify(scheduleSeatRepository, times(1)).findAllBySeatIdForUpdate(seatId);
        verify(scheduleSeatRepository, times(1)).cascadeUpdateScheduleSeatStatus(
                seatId,
                ScheduleSeatStatus.AVAILABLE,
                ScheduleSeatStatus.BLOCKED
        );
        verify(seatRepository, times(1)).save(seat);
    }

    @Test
    @DisplayName("Should throw IllegalStateException when updating seat status to INACTIVE if seat is held or booked")
    void updateSeatStatus_HeldOrBooked_ThrowsException() {
        Long seatId = 1L;
        String userId = "user-123";
        Seat seat = Seat.builder()
                .id(seatId)
                .status(SeatStatus.ACTIVE)
                .build();

        ScheduleSeat ssHeld = ScheduleSeat.builder().id(101L).status(ScheduleSeatStatus.HELD).build();

        when(seatRepository.findByIdAndVehicle_Operator_UserId(seatId, userId)).thenReturn(Optional.of(seat));
        when(scheduleSeatRepository.findAllBySeatIdForUpdate(seatId)).thenReturn(List.of(ssHeld));

        assertThrows(IllegalStateException.class, () -> {
            vehicleService.updateSeatStatus(seatId, userId, "INACTIVE");
        });

        verify(scheduleSeatRepository, times(1)).findAllBySeatIdForUpdate(seatId);
        verify(scheduleSeatRepository, never()).cascadeUpdateScheduleSeatStatus(any(), any(), any());
        verify(seatRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should update seat status to ACTIVE and cascade unblock schedule seats")
    void updateSeatStatus_ToActive_Success() {
        Long seatId = 1L;
        String userId = "user-123";
        Seat seat = Seat.builder()
                .id(seatId)
                .status(SeatStatus.INACTIVE)
                .build();

        when(seatRepository.findByIdAndVehicle_Operator_UserId(seatId, userId)).thenReturn(Optional.of(seat));

        vehicleService.updateSeatStatus(seatId, userId, "ACTIVE");

        assertEquals(SeatStatus.ACTIVE, seat.getStatus());
        verify(scheduleSeatRepository, times(1)).cascadeUpdateScheduleSeatStatus(
                seatId,
                ScheduleSeatStatus.BLOCKED,
                ScheduleSeatStatus.AVAILABLE
        );
        verify(seatRepository, times(1)).save(seat);
        verify(scheduleSeatRepository, never()).findAllBySeatIdForUpdate(any());
    }

    @Test
    @DisplayName("Should return immediately when seat target status equals current status (Idempotency)")
    void updateSeatStatus_SameStatus_NoOp() {
        Long seatId = 1L;
        String userId = "user-123";
        Seat seat = Seat.builder()
                .id(seatId)
                .status(SeatStatus.ACTIVE)
                .build();

        when(seatRepository.findByIdAndVehicle_Operator_UserId(seatId, userId)).thenReturn(Optional.of(seat));

        vehicleService.updateSeatStatus(seatId, userId, "ACTIVE");

        assertEquals(SeatStatus.ACTIVE, seat.getStatus());
        verify(seatRepository, never()).save(any());
        verify(scheduleSeatRepository, never()).cascadeUpdateScheduleSeatStatus(any(), any(), any());
        verify(scheduleSeatRepository, never()).findAllBySeatIdForUpdate(any());
    }

    @Test
    @DisplayName("Should throw SeatNotFoundException when seat does not exist or not owned by operator")
    void updateSeatStatus_NotFound_ThrowsException() {
        Long seatId = 999L;
        String userId = "user-123";

        when(seatRepository.findByIdAndVehicle_Operator_UserId(seatId, userId)).thenReturn(Optional.empty());

        assertThrows(SeatNotFoundException.class, () -> {
            vehicleService.updateSeatStatus(seatId, userId, "INACTIVE");
        });

        verify(seatRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when status is invalid or blank")
    void updateSeatStatus_InvalidStatus_ThrowsException() {
        Long seatId = 1L;
        String userId = "user-123";
        Seat seat = Seat.builder().id(seatId).status(SeatStatus.ACTIVE).build();

        when(seatRepository.findByIdAndVehicle_Operator_UserId(seatId, userId)).thenReturn(Optional.of(seat));

        assertThrows(IllegalArgumentException.class, () -> {
            vehicleService.updateSeatStatus(seatId, userId, "INVALID");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            vehicleService.updateSeatStatus(seatId, userId, "   ");
        });

        verify(seatRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should toggle seat VIP status atomically")
    void updateSeatVipStatus_Success() {
        Long seatId = 1L;
        String userId = "user-123";

        when(seatRepository.toggleSeatVipAtomic(seatId, userId)).thenReturn(1);

        vehicleService.updateSeatVipStatus(seatId, userId);

        verify(seatRepository, times(1)).toggleSeatVipAtomic(seatId, userId);
    }

    @Test
    @DisplayName("Should throw SeatNotFoundException when toggling VIP for non-existent seat")
    void updateSeatVipStatus_NotFound_ThrowsException() {
        Long seatId = 999L;
        String userId = "user-123";

        when(seatRepository.toggleSeatVipAtomic(seatId, userId)).thenReturn(0);

        assertThrows(SeatNotFoundException.class, () -> {
            vehicleService.updateSeatVipStatus(seatId, userId);
        });
    }

    @Test
    @DisplayName("Should update vehicle status to INACTIVE when no active schedules exist")
    void updateVehicleStatus_ToInactive_Success() {
        Long vehicleId = 10L;
        String userId = "user-123";
        Operator operator = createSampleOperator("op-1", userId);
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .status(VehicleStatus.ACTIVE)
                .operator(operator)
                .build();

        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent("lock:vehicle_schedule:10", "LOCKED", Duration.ofSeconds(5))).thenReturn(true);
        when(scheduleRepository.existsByVehicle_IdAndStatusIn(eq(vehicleId), any())).thenReturn(false);

        vehicleService.updateVehicleStatus(vehicleId, userId, "INACTIVE");

        assertEquals(VehicleStatus.INACTIVE, vehicle.getStatus());
        verify(vehicleRepository, times(1)).save(vehicle);
        verify(transactionalCacheEvictor, times(1)).evictAfterCommit("vehicles");
        verify(stringRedisTemplate, times(1)).delete("lock:vehicle_schedule:10");
    }

    @Test
    @DisplayName("Should update vehicle status to ACTIVE directly without Redis lock")
    void updateVehicleStatus_ToActive_Success() {
        Long vehicleId = 10L;
        String userId = "user-123";
        Operator operator = createSampleOperator("op-1", userId);
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .status(VehicleStatus.INACTIVE)
                .operator(operator)
                .build();

        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));

        vehicleService.updateVehicleStatus(vehicleId, userId, "ACTIVE");

        assertEquals(VehicleStatus.ACTIVE, vehicle.getStatus());
        verify(vehicleRepository, times(1)).save(vehicle);
        verify(transactionalCacheEvictor, times(1)).evictAfterCommit("vehicles");
        verify(stringRedisTemplate, never()).opsForValue();
    }

    @Test
    @DisplayName("Should return immediately when target status is same as current status")
    void updateVehicleStatus_SameStatus_NoOp() {
        Long vehicleId = 10L;
        String userId = "user-123";
        Operator operator = createSampleOperator("op-1", userId);
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .status(VehicleStatus.ACTIVE)
                .operator(operator)
                .build();

        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));

        vehicleService.updateVehicleStatus(vehicleId, userId, "ACTIVE");

        assertEquals(VehicleStatus.ACTIVE, vehicle.getStatus());
        verify(vehicleRepository, never()).save(any());
        verify(transactionalCacheEvictor, never()).evictAfterCommit(any());
        verify(stringRedisTemplate, never()).opsForValue();
    }

    @Test
    @DisplayName("Should throw VehicleNotFoundException when vehicle not found")
    void updateVehicleStatus_Fail_VehicleNotFound() {
        Long vehicleId = 999L;
        String userId = "user-123";

        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.empty());

        assertThrows(VehicleNotFoundException.class, () -> {
            vehicleService.updateVehicleStatus(vehicleId, userId, "INACTIVE");
        });

        verify(vehicleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw AccessDeniedException when updating vehicle not owned by operator")
    void updateVehicleStatus_Fail_NotOwner() {
        Long vehicleId = 10L;
        String userId = "user-123";
        Operator otherOperator = createSampleOperator("op-2", "other-user");
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .status(VehicleStatus.ACTIVE)
                .operator(otherOperator)
                .build();

        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));

        assertThrows(AccessDeniedException.class, () -> {
            vehicleService.updateVehicleStatus(vehicleId, userId, "INACTIVE");
        });

        verify(vehicleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw IllegalStateException and release lock when active schedules exist")
    void updateVehicleStatus_Fail_ActiveSchedulesExist() {
        Long vehicleId = 10L;
        String userId = "user-123";
        Operator operator = createSampleOperator("op-1", userId);
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .status(VehicleStatus.ACTIVE)
                .operator(operator)
                .build();

        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent("lock:vehicle_schedule:10", "LOCKED", Duration.ofSeconds(5))).thenReturn(true);
        when(scheduleRepository.existsByVehicle_IdAndStatusIn(eq(vehicleId), any())).thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            vehicleService.updateVehicleStatus(vehicleId, userId, "INACTIVE");
        });

        assertTrue(ex.getMessage().contains("Schedule is already open or running"));
        assertEquals(VehicleStatus.ACTIVE, vehicle.getStatus());
        verify(vehicleRepository, never()).save(any());
        verify(stringRedisTemplate, times(1)).delete("lock:vehicle_schedule:10");
    }

    @Test
    @DisplayName("Should throw IllegalStateException when Redis lock cannot be acquired")
    void updateVehicleStatus_Fail_RedisLockConflict() {
        Long vehicleId = 10L;
        String userId = "user-123";
        Operator operator = createSampleOperator("op-1", userId);
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .status(VehicleStatus.ACTIVE)
                .operator(operator)
                .build();

        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent("lock:vehicle_schedule:10", "LOCKED", Duration.ofSeconds(5))).thenReturn(false);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            vehicleService.updateVehicleStatus(vehicleId, userId, "INACTIVE");
        });

        assertTrue(ex.getMessage().contains("Xe đang được xếp lịch hoặc xử lý bởi thao tác khác"));
        assertEquals(VehicleStatus.ACTIVE, vehicle.getStatus());
        verify(vehicleRepository, never()).save(any());
        verify(stringRedisTemplate, never()).delete("lock:vehicle_schedule:10");
    }

    @Test
    @DisplayName("Should sanitize and normalize status string correctly (lowercase, whitespace, quotes)")
    void updateVehicleStatus_NormalizedStatus_Success() {
        Long vehicleId = 10L;
        String userId = "user-123";
        Operator operator = createSampleOperator("op-1", userId);
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .status(VehicleStatus.ACTIVE)
                .operator(operator)
                .build();

        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent("lock:vehicle_schedule:10", "LOCKED", Duration.ofSeconds(5))).thenReturn(true);
        when(scheduleRepository.existsByVehicle_IdAndStatusIn(eq(vehicleId), any())).thenReturn(false);

        vehicleService.updateVehicleStatus(vehicleId, userId, " \"inactive\" ");

        assertEquals(VehicleStatus.INACTIVE, vehicle.getStatus());
        verify(vehicleRepository, times(1)).save(vehicle);
        verify(transactionalCacheEvictor, times(1)).evictAfterCommit("vehicles");
        verify(stringRedisTemplate, times(1)).delete("lock:vehicle_schedule:10");
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when status is invalid or blank")
    void updateVehicleStatus_InvalidStatus_ThrowsException() {
        Long vehicleId = 10L;
        String userId = "user-123";
        Operator operator = createSampleOperator("op-1", userId);
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .status(VehicleStatus.ACTIVE)
                .operator(operator)
                .build();

        when(vehicleRepository.getDetailWithSeatsById(vehicleId)).thenReturn(Optional.of(vehicle));

        assertThrows(IllegalArgumentException.class, () -> {
            vehicleService.updateVehicleStatus(vehicleId, userId, "INVALID_STATUS");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            vehicleService.updateVehicleStatus(vehicleId, userId, "  ");
        });

        verify(vehicleRepository, never()).save(any());
    }
}
