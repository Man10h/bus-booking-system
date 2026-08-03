package com.Man10h.core_service.service.impl;

import com.Man10h.core_service.controller.exception.*;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.model.entities.Seat;
import com.Man10h.core_service.model.entities.Vehicle;
import com.Man10h.core_service.model.entities.VehicleType;
import com.Man10h.core_service.model.enums.*;
import com.Man10h.core_service.model.request.CreateVehicleRequest;
import com.Man10h.core_service.model.request.CreateVehicleTypeRequest;
import com.Man10h.core_service.model.request.UpdateVehicleRequest;
import com.Man10h.core_service.model.request.UpdateVehicleTypeRequest;
import com.Man10h.core_service.model.response.OperatorResponse;
import com.Man10h.core_service.model.response.SeatResponse;
import com.Man10h.core_service.model.response.VehicleResponse;
import com.Man10h.core_service.model.response.VehicleTypeResponse;
import com.Man10h.core_service.repository.*;
import com.Man10h.core_service.service.VehicleService;
import com.Man10h.core_service.util.SeatGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        Optional<Operator> optional = operatorRepository.findByUserId(userId);
        if(optional.isEmpty()) {
            throw new OperatorNotFoundException("Operator not found");
        }
        return optional.get();
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
        Operator operator = getOperatorByUserId(userId);
        Optional<VehicleType> optionalVehicleType = vehicleTypeRepository.findById(request.vehicleTypeId());
        if(optionalVehicleType.isEmpty()) {
            throw new VehicleTypeNotFoundException("Vehicle type not found");
        }
        VehicleType vehicleType = optionalVehicleType.get();
        Vehicle vehicle = Vehicle.builder()
                .brand(request.brand())
                .model(request.model())
                .licensePlate(request.licensePlate())
                .description(request.description())
                .totalSeats((long) vehicleType.getRows() * vehicleType.getCols() * vehicleType.getFloors())
                .status(VehicleStatus.ACTIVE)
                .vehicleType(vehicleType)
                .operator(operator)
                .build();

        List<Seat> seatList = seatGenerator.generate(optionalVehicleType.get());
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
        if(!vehicleTypeRepository.existsById(request.vehicleTypeId())){
            throw new VehicleTypeNotFoundException("Vehicle type not found");
        }
        Vehicle vehicle = vehicleRepository.getDetailWithSeatsById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found"));
        if(!vehicle.getOperator().getUserId().equals(userId)){
            throw new AccessDeniedException("You not owned this vehicle");
        }

        // If changing vehicle type, check for active schedules and regenerate seats
        if (!vehicle.getVehicleType().getId().equals(request.vehicleTypeId())) {
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

        vehicle.setLicensePlate(request.licensePlate());
        vehicle.setBrand(request.brand());
        vehicle.setModel(request.model());
        vehicle.setDescription(request.description());
        vehicleRepository.save(vehicle);
    }

    @Transactional
    public void updateVehicleStatus(Long id, String userId, String status) {
        Vehicle vehicle = vehicleRepository.getDetailWithSeatsById(id).orElseThrow(() -> new VehicleNotFoundException("Vehicle not found"));
        if(!vehicle.getOperator().getUserId().equals(userId)){
            throw new AccessDeniedException("You not owned this vehicle");
        }
        VehicleStatus vehicleStatus = VehicleStatus.valueOf(status);
        if(vehicleStatus == vehicle.getStatus()){
            return;
        }
        if(vehicleStatus != VehicleStatus.ACTIVE){
            if(scheduleRepository.existsByVehicle_IdAndStatusIn(id, List.of(ScheduleStatus.OPEN, ScheduleStatus.RUNNING))){
                throw new IllegalStateException("Schedule is already open or running");
            }
        }
        vehicle.setStatus(vehicleStatus);
        vehicleRepository.save(vehicle);
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

    @Transactional
    public void updateSeatStatus(Long id, String userId, String status) {
        Optional<Seat> optional = seatRepository.findByIdAndVehicle_Operator_UserId(id, userId);
        if(optional.isEmpty()){
            throw new SeatNotFoundException("Seat not found");
        }
        Seat seat = optional.get();
        SeatStatus seatStatus = SeatStatus.valueOf(status);
        if(seat.getStatus() == seatStatus){
            return;
        }

        if(seatStatus == SeatStatus.INACTIVE){
            if(scheduleSeatRepository.existsBySeat_IdAndSchedule_StatusInAndStatusIn(id,
                    List.of(ScheduleStatus.OPEN, ScheduleStatus.RUNNING),
                    List.of(ScheduleSeatStatus.HELD, ScheduleSeatStatus.BOOKED
            ))){
                throw new IllegalStateException("Schedule seat is held/booked");
            }
            seat.getScheduleSeatList().forEach(scheduleSeat -> {
                if(scheduleSeat.getStatus() == ScheduleSeatStatus.AVAILABLE && scheduleSeat.getSchedule().getStatus() == ScheduleStatus.OPEN){
                    scheduleSeat.setStatus(ScheduleSeatStatus.BLOCKED);
                }
            });
        }

        if (seatStatus == SeatStatus.ACTIVE) {
            seat.getScheduleSeatList().forEach(scheduleSeat -> {
                if (scheduleSeat.getStatus() == ScheduleSeatStatus.BLOCKED
                        && scheduleSeat.getSchedule().getStatus() == ScheduleStatus.OPEN) {

                    scheduleSeat.setStatus(ScheduleSeatStatus.AVAILABLE);
                }
            });
        }
        seat.setStatus(seatStatus);
        seatRepository.save(seat);
    }

    @Transactional
    public void updateSeatVipStatus(Long id, String userId) {
        Optional<Seat> optional = seatRepository.findByIdAndVehicle_Operator_UserId(id, userId);
        if(optional.isEmpty()){
            throw new SeatNotFoundException("Seat not found");
        }
        Seat seat = optional.get();
        seat.setIsVip(!seat.getIsVip());
        seatRepository.save(seat);
    }

    @Override
    public List<VehicleTypeResponse> getAllVehicleTypes() {
        return vehicleTypeRepository.findAll().stream().map(vehicleType -> new VehicleTypeResponse(
                vehicleType.getId(),
                vehicleType.getSeatType(),
                vehicleType.getCode(),
                vehicleType.getName(),
                vehicleType.getFloors(),
                vehicleType.getRows(),
                vehicleType.getCols()
        )).collect(Collectors.toList());
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
        }
        else {
            throw new VehicleTypeAlreadyInUseException("Vehicle type already in use");
        }
    }


}
