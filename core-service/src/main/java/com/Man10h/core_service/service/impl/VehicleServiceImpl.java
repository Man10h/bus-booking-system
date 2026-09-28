package com.Man10h.core_service.service.impl;

import com.Man10h.core_service.controller.exception.*;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.model.entities.ScheduleSeat;
import com.Man10h.core_service.model.entities.Seat;
import com.Man10h.core_service.model.entities.Vehicle;
import com.Man10h.core_service.model.entities.VehicleType;
import com.Man10h.core_service.model.enums.*;
import com.Man10h.core_service.model.request.*;
import com.Man10h.core_service.model.response.*;
import com.Man10h.core_service.repository.*;
import com.Man10h.core_service.repository.spec.VehicleTypeSpecification;
import com.Man10h.core_service.service.VehicleService;
import com.Man10h.core_service.util.SeatGenerator;
import com.Man10h.core_service.util.TransactionalCacheEvictor;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final OperatorRepository operatorRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final SeatGenerator seatGenerator;
    private final SeatRepository seatRepository;
    private final ScheduleRepository scheduleRepository;
    private final ScheduleSeatRepository scheduleSeatRepository;
    private final MasterDataCacheService masterDataCacheService;
    private final StringRedisTemplate stringRedisTemplate;
    private final TransactionalCacheEvictor transactionalCacheEvictor;

    public Vehicle getVehicleDetailById(Long id) {
        Optional<Vehicle> optional = vehicleRepository.getDetailById(id);
        if(optional.isEmpty()) {
            throw new VehicleNotFoundException("Vehicle not found");
        }
        return optional.get();
    }

    public Vehicle getVehicleById(Long id) {
        Optional<Vehicle> optionalVehicle = vehicleRepository.findById(id);
        if(optionalVehicle.isEmpty()) {
            throw new VehicleNotFoundException("Vehicle not found");
        }
        return optionalVehicle.get();
    }

    public Operator getOperatorByUserId(String userId) {
        return masterDataCacheService.getOperatorByUserId(userId)
                .orElseThrow(() -> new OperatorNotFoundException("Operator not found"));
    }

    public VehicleResponse toResponse(Vehicle vehicle) {
        VehicleType vehicleType = vehicle.getVehicleType();
        VehicleTypeResponse vehicleTypeResponse = new VehicleTypeResponse(
                vehicleType.getId(),
                vehicleType.getSeatType(),
                vehicleType.getCode(),
                vehicleType.getName(),
                vehicleType.getFloors(),
                vehicleType.getRows(),
                vehicleType.getCols()
        );
        Operator operator = vehicle.getOperator();
        OperatorResponse operatorResponse = new OperatorResponse(operator.getId(), operator.getCompanyName(), operator.getContactPhone(), operator.getTaxCode(), operator.getAvatarUrl());

        return new VehicleResponse(
          vehicle.getId(),
          vehicle.getLicensePlate(),
          vehicle.getBrand(),
          vehicle.getModel(),
          vehicle.getTotalSeats(),
          vehicle.getDescription(),
          vehicle.getStatus(),
          vehicleTypeResponse,
          operatorResponse
        );
    }

    @Transactional
    public VehicleResponse createVehicle(String userId, CreateVehicleRequest request) {
        String normalizedLicensePlate = request.licensePlate().trim().toUpperCase();
        if (vehicleRepository.existsByLicensePlate(normalizedLicensePlate)) {
            throw new LicensePlateAlreadyExistsException("Biển số xe " + normalizedLicensePlate + " đã tồn tại trong hệ thống!");
        }

        Operator operator = masterDataCacheService.getOperatorByUserId(userId)
                .orElseThrow(() -> new OperatorNotFoundException("Operator not found"));
        VehicleType vehicleType = masterDataCacheService.getVehicleTypeById(request.vehicleTypeId())
                .orElseThrow(() -> new VehicleTypeNotFoundException("Vehicle type not found"));

        Vehicle vehicle = Vehicle.builder()
                .brand(request.brand())
                .model(request.model())
                .licensePlate(normalizedLicensePlate)
                .description(request.description())
                .totalSeats((long) vehicleType.getRows() * vehicleType.getCols() * vehicleType.getFloors())
                .status(VehicleStatus.ACTIVE)
                .vehicleType(vehicleType)
                .operator(operator)
                .build();

        List<Seat> seatList = seatGenerator.generate(vehicleType);
        seatList.forEach(seat -> seat.setVehicle(vehicle));
        vehicle.setVehicleSeatList(seatList);
        vehicleRepository.save(vehicle);
        return toResponse(vehicle);
    }

    @Override
    public VehicleResponse getVehicleDetail(Long id) {
        return toResponse(getVehicleDetailById(id));
    }

    @Override
    public Page<VehicleResponse> getOperatorsVehicles(String userId, Pageable pageable) {
        return vehicleRepository.getOperatorsVehicles(userId, pageable).map(this::toResponse);
    }

    @Transactional
    public void updateVehicle(Long id, String userId, UpdateVehicleRequest request) {
        String normalizedLicensePlate = request.licensePlate().trim().toUpperCase();
        if (vehicleRepository.existsByLicensePlateAndIdNot(normalizedLicensePlate, id)) {
            throw new LicensePlateAlreadyExistsException("Biển số xe " + normalizedLicensePlate + " đã tồn tại trong hệ thống!");
        }

        if(!vehicleTypeRepository.existsById(request.vehicleTypeId())){
            throw new VehicleTypeNotFoundException("Vehicle type not found");
        }
        Vehicle vehicle = vehicleRepository.getDetailWithSeatsById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found"));
        if(!vehicle.getOperator().getUserId().equals(userId)){
            throw new AccessDeniedException("You not owned this vehicle");
        }

        boolean isChangingVehicleType = !vehicle.getVehicleType().getId().equals(request.vehicleTypeId());
        String vehicleLockKey = "lock:vehicle_schedule:" + id;
        Boolean vehicleLocked = null;

        if (isChangingVehicleType) {
            vehicleLocked = stringRedisTemplate.opsForValue()
                    .setIfAbsent(vehicleLockKey, "LOCKED", Duration.ofSeconds(5));
            if (Boolean.FALSE.equals(vehicleLocked)) {
                throw new IllegalStateException("Xe đang được xếp lịch hoặc xử lý bởi thao tác khác, vui lòng thử lại sau!");
            }
        }

        try {
            // If changing vehicle type, check for active schedules and regenerate seats
            if (isChangingVehicleType) {
                if (scheduleRepository.existsByVehicle_IdAndStatusIn(id, List.of(ScheduleStatus.OPEN, ScheduleStatus.RUNNING))) {
                    throw new IllegalStateException("Cannot change vehicle type because the vehicle has active schedules");
                }
                VehicleType newVehicleType = vehicleTypeRepository.findById(request.vehicleTypeId())
                        .orElseThrow(() -> new VehicleTypeNotFoundException("Vehicle type not found"));

                vehicle.getVehicleSeatList().clear();
                List<Seat> seatList = seatGenerator.generate(newVehicleType);
                seatList.forEach(seat -> seat.setVehicle(vehicle));
                vehicle.getVehicleSeatList().addAll(seatList);
                vehicle.setVehicleType(newVehicleType);
                vehicle.setTotalSeats((long) newVehicleType.getRows() * newVehicleType.getCols() * newVehicleType.getFloors());
            } else {
                vehicle.setTotalSeats(request.totalSeats());
            }

            vehicle.setLicensePlate(normalizedLicensePlate);
            vehicle.setBrand(request.brand());
            vehicle.setModel(request.model());
            vehicle.setDescription(request.description());
            vehicleRepository.save(vehicle);

            transactionalCacheEvictor.evictAfterCommit("vehicles");
        } finally {
            if (isChangingVehicleType && Boolean.TRUE.equals(vehicleLocked)) {
                stringRedisTemplate.delete(vehicleLockKey);
            }
        }
    }

    @Transactional
    public void updateVehicleStatus(Long id, String userId, String status) {
        Vehicle vehicle = vehicleRepository.getDetailWithSeatsById(id).orElseThrow(() -> new VehicleNotFoundException("Vehicle not found"));
        if(!vehicle.getOperator().getUserId().equals(userId)){
            throw new AccessDeniedException("You not owned this vehicle");
        }
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Trạng thái xe không được để trống!");
        }
        String cleanStatus = status.trim().replace("\"", "").toUpperCase();
        VehicleStatus vehicleStatus;
        try {
            vehicleStatus = VehicleStatus.valueOf(cleanStatus);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái xe không hợp lệ: " + status + ". Giá trị hợp lệ: ACTIVE, INACTIVE");
        }

        if(vehicleStatus == vehicle.getStatus()){
            return;
        }

        String vehicleLockKey = "lock:vehicle_schedule:" + id;
        Boolean vehicleLocked = null;
        if (vehicleStatus != VehicleStatus.ACTIVE) {
            vehicleLocked = stringRedisTemplate.opsForValue()
                    .setIfAbsent(vehicleLockKey, "LOCKED", Duration.ofSeconds(5));
            if (Boolean.FALSE.equals(vehicleLocked)) {
                throw new IllegalStateException("Xe đang được xếp lịch hoặc xử lý bởi thao tác khác, vui lòng thử lại sau!");
            }
        }

        try {
            if(vehicleStatus != VehicleStatus.ACTIVE){
                if(scheduleRepository.existsByVehicle_IdAndStatusIn(id, List.of(ScheduleStatus.OPEN, ScheduleStatus.RUNNING))){
                    throw new IllegalStateException("Schedule is already open or running");
                }
            }
            vehicle.setStatus(vehicleStatus);
            vehicleRepository.save(vehicle);

            transactionalCacheEvictor.evictAfterCommit("vehicles");
        } finally {
            if (vehicleStatus != VehicleStatus.ACTIVE && Boolean.TRUE.equals(vehicleLocked)) {
                stringRedisTemplate.delete(vehicleLockKey);
            }
        }
    }

    @Override
    public List<SeatResponse> getVehicleSeats(Long id, String userId) {
        Optional<Vehicle> optional = vehicleRepository.getDetailWithSeatsById(id);
        if(optional.isEmpty()) {
            throw new VehicleNotFoundException("Vehicle not found");
        }
        Vehicle vehicle = optional.get();
        if(!vehicle.getOperator().getUserId().equals(userId)){
            throw new AccessDeniedException("You not owned this vehicle");
        }

        return vehicle.getVehicleSeatList().stream().map(
                seat -> new SeatResponse(
                        seat.getId(),
                        seat.getSeatNumber(),
                        seat.getFloor(),
                        seat.getRow(),
                        seat.getCol(),
                        seat.getSeatType().toString(),
                        seat.getStatus(),
                        seat.getIsVip()
                )
        ).toList();
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateSeatStatus(Long id, String userId, String status) {
        Seat seat = seatRepository.findByIdAndVehicle_Operator_UserId(id, userId)
                .orElseThrow(() -> new SeatNotFoundException("Seat not found"));

        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Trạng thái ghế không được để trống!");
        }
        String cleanStatus = status.trim().replace("\"", "").toUpperCase();
        SeatStatus seatStatus;
        try {
            seatStatus = SeatStatus.valueOf(cleanStatus);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái ghế không hợp lệ: " + status + ". Giá trị hợp lệ: ACTIVE, INACTIVE");
        }

        if (seat.getStatus() == seatStatus) {
            return;
        }

        if (seatStatus == SeatStatus.INACTIVE) {
            List<ScheduleSeat> activeScheduleSeats = scheduleSeatRepository.findAllBySeatIdForUpdate(id);
            boolean isHeldOrBooked = activeScheduleSeats.stream()
                    .anyMatch(ss -> ss.getStatus() == ScheduleSeatStatus.HELD
                            || ss.getStatus() == ScheduleSeatStatus.BOOKED);
            if (isHeldOrBooked) {
                throw new IllegalStateException("Schedule seat is held/booked");
            }
            scheduleSeatRepository.cascadeUpdateScheduleSeatStatus(id, ScheduleSeatStatus.AVAILABLE, ScheduleSeatStatus.BLOCKED);
        }

        if (seatStatus == SeatStatus.ACTIVE) {
            scheduleSeatRepository.cascadeUpdateScheduleSeatStatus(id, ScheduleSeatStatus.BLOCKED, ScheduleSeatStatus.AVAILABLE);
        }
        seat.setStatus(seatStatus);
        seatRepository.save(seat);
    }

    @Transactional
    public void updateSeatVipStatus(Long id, String userId) {
        int updated = seatRepository.toggleSeatVipAtomic(id, userId);
        if(updated == 0){
            throw new SeatNotFoundException("Seat not found");
        }
    }

    private VehicleTypeResponse toVehicleTypeResponse(VehicleType vehicleType) {
        return new VehicleTypeResponse(
                vehicleType.getId(),
                vehicleType.getSeatType(),
                vehicleType.getCode(),
                vehicleType.getName(),
                vehicleType.getFloors(),
                vehicleType.getRows(),
                vehicleType.getCols()
        );
    }

    @Override
    public VehicleTypePageResponse findVehicleTypes(VehicleTypeFilter filter, Pageable pageable) {
        Specification<VehicleType> spec = Specification.allOf(
                VehicleTypeSpecification.keyword(filter != null ? filter.keyword() : null),
                VehicleTypeSpecification.seatType(filter != null ? filter.seatType() : null),
                VehicleTypeSpecification.floors(filter != null ? filter.floors() : null)
        );

        Page<VehicleType> page = vehicleTypeRepository.findAll(spec, pageable);
        List<VehicleTypeResponse> content = page.getContent().stream()
                .map(this::toVehicleTypeResponse)
                .toList();

        return new VehicleTypePageResponse(
                content,
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
        );
    }

    @Override
    public List<VehicleTypeResponse> getAllVehicleTypes() {
        return vehicleTypeRepository.findAll().stream()
                .map(this::toVehicleTypeResponse)
                .collect(Collectors.toList());
    }

    @Override
    public VehicleTypeResponse createVehicleType(CreateVehicleTypeRequest request) {
        VehicleType vehicleType = VehicleType.builder()
                .vehicles(new ArrayList<>())
                .code(request.code())
                .name(request.name())
                .floors(request.floors())
                .rows(request.rows())
                .cols(request.cols())
                .seatType(SeatType.valueOf(request.seatType()))
                .build();
        vehicleTypeRepository.save(vehicleType);
        masterDataCacheService.evictVehicleType(null);
        return new VehicleTypeResponse(
                vehicleType.getId(),
                vehicleType.getSeatType(),
                vehicleType.getCode(),
                vehicleType.getName(),
                vehicleType.getFloors(),
                vehicleType.getRows(),
                vehicleType.getCols()
        );
    }

    @Transactional
    public void updateVehicleType(Long id, UpdateVehicleTypeRequest request) {
        VehicleType vehicleType = vehicleTypeRepository.getVehicleTypeById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found"));
        if(vehicleType.getVehicles() == null || vehicleType.getVehicles().isEmpty()){
            vehicleType.setName(request.name());
            vehicleType.setCode(request.code());
            vehicleType.setFloors(request.floors());
            vehicleType.setRows(request.rows());
            vehicleType.setCols(request.cols());
            vehicleType.setSeatType(SeatType.valueOf(request.seatType()));
            vehicleTypeRepository.save(vehicleType);
            masterDataCacheService.evictVehicleType(id);
        }
        else {
            throw new VehicleTypeAlreadyInUseException("Vehicle type already in use");
        }
    }

    @Transactional
    public void deleteVehicleType(Long id) {
        VehicleType vehicleType = vehicleTypeRepository.getVehicleTypeById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found"));
        if(vehicleType.getVehicles() == null || vehicleType.getVehicles().isEmpty()){
            vehicleTypeRepository.delete(vehicleType);
            masterDataCacheService.evictVehicleType(id);
        }
        else {
            throw new VehicleTypeAlreadyInUseException("Vehicle type already in use");
        }
    }


}
