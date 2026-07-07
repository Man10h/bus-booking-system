package com.Man10h.core_service.service.impl;

import com.Man10h.core_service.controller.exception.*;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.model.entities.Seat;
import com.Man10h.core_service.model.entities.Vehicle;
import com.Man10h.core_service.model.entities.VehicleType;
import com.Man10h.core_service.model.enums.SeatStatus;
import com.Man10h.core_service.model.enums.VehicleStatus;
import com.Man10h.core_service.model.request.CreateVehicleRequest;
import com.Man10h.core_service.model.request.UpdateVehicleRequest;
import com.Man10h.core_service.model.response.OperatorResponse;
import com.Man10h.core_service.model.response.SeatResponse;
import com.Man10h.core_service.model.response.VehicleResponse;
import com.Man10h.core_service.model.response.VehicleTypeResponse;
import com.Man10h.core_service.repository.OperatorRepository;
import com.Man10h.core_service.repository.SeatRepository;
import com.Man10h.core_service.repository.VehicleRepository;
import com.Man10h.core_service.repository.VehicleTypeRepository;
import com.Man10h.core_service.service.VehicleService;
import com.Man10h.core_service.util.SeatGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final OperatorRepository operatorRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final SeatGenerator seatGenerator;
    private final SeatRepository seatRepository;

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
        Vehicle vehicle = Vehicle.builder()
                .brand(request.brand())
                .model(request.model())
                .licensePlate(request.licensePlate())
                .description(request.description())
                .totalSeats(request.totalSeats())
                .status(VehicleStatus.ACTIVE)
                .vehicleType(vehicleTypeRepository.getReferenceById(request.vehicleTypeId()))
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
        if(!vehicleTypeRepository.existsById(id)){
            throw new VehicleTypeNotFoundException("Vehicle type not found");
        }
        Vehicle vehicle = getVehicleDetailById(id);
        if(!vehicle.getOperator().getUserId().equals(userId)){
            throw new AccessDeniedException("You not owned this vehicle");
        }
        vehicle.setLicensePlate(request.licensePlate());
        vehicle.setBrand(request.brand());
        vehicle.setModel(request.model());
        vehicle.setTotalSeats(request.totalSeats());
        vehicle.setDescription(request.description());
        vehicle.setVehicleType(vehicleTypeRepository.getReferenceById(request.vehicleTypeId()));
        vehicleRepository.save(vehicle);
    }

    @Transactional
    public void updateStatus(Long id, String userId, String status) {
        Vehicle vehicle = getVehicleDetailById(id);
        if(!vehicle.getOperator().getUserId().equals(userId)){
            throw new AccessDeniedException("You not owned this vehicle");
        }
        vehicle.setStatus(VehicleStatus.valueOf(status));
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
                        seat.getStatus().toString(),
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
        seat.setStatus(SeatStatus.valueOf(status));
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


}
