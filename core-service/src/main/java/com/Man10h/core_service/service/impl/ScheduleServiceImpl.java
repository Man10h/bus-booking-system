package com.Man10h.core_service.service.impl;

import com.Man10h.core_service.controller.exception.*;
import com.Man10h.core_service.model.entities.*;
import com.Man10h.core_service.model.enums.*;
import com.Man10h.core_service.model.request.CreateScheduleRequest;
import com.Man10h.core_service.model.request.ScheduleFilter;
import com.Man10h.core_service.model.request.UpdateScheduleRequest;
import com.Man10h.core_service.model.response.*;
import com.Man10h.core_service.repository.*;
import com.Man10h.core_service.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static com.Man10h.core_service.repository.spec.ScheduleSpecification.*;


@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleServiceImpl implements ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final VehicleRepository vehicleRepository;
    private final RouteRepository routeRepository;
    private final ScheduleSeatRepository scheduleSeatRepository;
    private final OperatorRepository operatorRepository;
    private final BookingRepository bookingRepository;

    public VehicleResponse toVehicleResponse(Vehicle vehicle) {
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

    public ScheduleSummaryResponse toSummaryResponse(Schedule schedule) {
        return new ScheduleSummaryResponse(
                schedule.getId(), 
                schedule.getOperatorId(), 
                schedule.getDepartureTime(), 
                schedule.getArrivalTime(), 
                schedule.getBasePrice(), 
                schedule.getVipPrice(), 
                schedule.getAvailableSeats(), 
                schedule.getStatus(),
                schedule.getTotalSeats(),
                schedule.getRoute() != null && schedule.getRoute().getDepartureCity() != null ? schedule.getRoute().getDepartureCity().getName() : null,
                schedule.getRoute() != null && schedule.getRoute().getArrivalCity() != null ? schedule.getRoute().getArrivalCity().getName() : null
        );
    }

    public ScheduleDetailResponse toDetailResponse(Schedule schedule) {
        return new ScheduleDetailResponse(
            schedule.getId(),
            schedule.getOperatorId(),
            schedule.getDepartureTime(),
            schedule.getArrivalTime(),
            schedule.getBasePrice(),
            schedule.getVipPrice(),
            schedule.getAvailableSeats(),
            schedule.getTotalSeats(),
            schedule.getStatus(),
            toVehicleResponse(schedule.getVehicle()),
            toRouteDetailResponse(schedule.getRoute())

        );
    }

    @Transactional
    @CacheEvict(value = "schedules", allEntries = true)
    public ScheduleDetailResponse createSchedule(String userId, CreateScheduleRequest request) {
        if (!request.departureTime().isBefore(request.arrivalTime())) {
            throw new IllegalArgumentException("Departure time must be before arrival time");
        }
        Optional<Route> optionalRoute = routeRepository.getDetailById(request.routeId());
        if(optionalRoute.isEmpty()){
            throw new RouteNotFoundException("Route Not Found");
        }
        Optional<Vehicle> optionalVehicle = vehicleRepository.getDetailWithSeatsById(request.vehicleId());
        if(optionalVehicle.isEmpty()){
            throw new VehicleNotFoundException("Vehicle Not Found");
        }
        Route route = optionalRoute.get();
        Vehicle vehicle = optionalVehicle.get();
        if(route.getStatus() != RouteStatus.ACTIVE){
            throw new IllegalStateException("Route Status is not active");
        }
        if(vehicle.getStatus() != VehicleStatus.ACTIVE){
            throw new IllegalStateException("Vehicle Status is not active");
        }
        if(!vehicle.getOperator().getUserId().equals(userId) || !route.getOperator().getUserId().equals(userId)){
            throw new AccessDeniedException("You not owned the vehicle or the route");
        }
        if(scheduleRepository.existsOverlappingSchedule(request.vehicleId(), request.departureTime(), request.arrivalTime())){
            throw new IllegalStateException(
                    "Vehicle already has a schedule in this time range");
        }
        Schedule schedule = Schedule.builder()
                .route(route)
                .vehicle(vehicle)
                .operatorId(route.getOperator().getId())
                .arrivalTime(request.arrivalTime())
                .departureTime(request.departureTime())
                .basePrice(request.basePrice())
                .bookingList(new ArrayList<>())
                .scheduleSeatList(new ArrayList<>())
                .status(ScheduleStatus.OPEN)
                .vipPrice(request.vipPrice())
                .totalSeats(vehicle.getTotalSeats())
                .build();


        List<ScheduleSeat> scheduleSeatList = new ArrayList<>();
        for(Seat seat: vehicle.getVehicleSeatList()){
            if(!seat.getStatus().equals(SeatStatus.INACTIVE)){
                ScheduleSeat scheduleSeat = ScheduleSeat.builder()
                        .seat(seat)
                        .schedule(schedule)
                        .price(seat.getIsVip() ? request.vipPrice() : request.basePrice())
                        .status(ScheduleSeatStatus.AVAILABLE)
                        .build();

                scheduleSeatList.add(scheduleSeat);
            }
        }
        schedule.setAvailableSeats((long) scheduleSeatList.size());
        schedule.setScheduleSeatList(scheduleSeatList);
        scheduleRepository.save(schedule);
        return toDetailResponse(schedule);
    }

    @Override
    @Cacheable(
            value = "schedules",
            key = "T(com.Man10h.core_service.util.CacheKeyUtil).scheduleKey(#filter, #pageable)"
    )
    public SchedulePageResponse findSchedules(ScheduleFilter filter, Pageable pageable) {

        Specification<Schedule> spec = Specification.allOf(
                operator(filter.operatorId()),
                route(filter.routeId()),
                routeDepartureCity(filter.departureCityId()),
                routeArrivalCity(filter.arrivalCityId()),
                departureTime(filter.departureTime()),
                arrivalTime(filter.arrivalTime()),
                vehicleType(filter.vehicleTypeId()),
                status(filter.status())
        );
        Page<ScheduleDetailResponse> page = scheduleRepository.findAll(spec, pageable).map(this::toDetailResponse);
        return new SchedulePageResponse(
                page.getContent(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
        );
    }

    @Override
    public List<ScheduleSeatResponse> getScheduleSeats(Long id) {
        List<ScheduleSeat> scheduleSeatList = scheduleSeatRepository.findBySchedule_Id(id);

        return scheduleSeatList.stream()
                .map(
                scheduleSeat -> {
                    return new ScheduleSeatResponse(
                            scheduleSeat.getId(),
                            scheduleSeat.getPrice(),
                            scheduleSeat.getHeldBy(),
                            scheduleSeat.getHeldAt(),
                            scheduleSeat.getExpiredAt(),
                            scheduleSeat.getStatus(),
                            new SeatResponse(
                                    scheduleSeat.getSeat().getId(),
                                    scheduleSeat.getSeat().getSeatNumber(),
                                    scheduleSeat.getSeat().getFloor(),
                                    scheduleSeat.getSeat().getRow(),
                                    scheduleSeat.getSeat().getCol(),
                                    scheduleSeat.getSeat().getSeatType().toString(),
                                    scheduleSeat.getSeat().getStatus(),
                                    scheduleSeat.getSeat().getIsVip()
                    ));
                }
                ).toList()
                ;
    }

    @Override
    public ScheduleDetailResponse getScheduleDetail(Long id) {
        return scheduleRepository.getDetailById(id)
                .map(this::toDetailResponse).orElseThrow(() -> new ScheduleNotFoundException("Schedule not found"));
    }

    @Transactional
    @CacheEvict(value = "schedules", allEntries = true)
    public void cancelSchedule(String userId, Long id) {
        Schedule schedule = scheduleRepository.findById(id).orElseThrow(() -> new ScheduleNotFoundException("Schedule not found"));
        Operator operator = operatorRepository.findByUserId(userId).orElseThrow(() -> new OperatorNotFoundException("Operator not found"));
        if(!Objects.equals(schedule.getOperatorId(), operator.getId())){
            throw new AccessDeniedException("Operator does not have access to the schedule");
        }
        if(schedule.getStatus() != ScheduleStatus.OPEN){
            log.info("=====SCHEDULE IS OPEN=====");
            throw new IllegalStateException("Schedule is not open");
        }
        if(scheduleSeatRepository.existsBySchedule_IdAndStatusIn(id, List.of(ScheduleSeatStatus.BOOKED, ScheduleSeatStatus.HELD))){
            log.info("=====SCHEDULE SEAT IS HELD OR BOOKED=====");
            throw new IllegalStateException("Schedule seat is in progress");
        }
        schedule.setStatus(ScheduleStatus.CANCELLED);
        scheduleRepository.save(schedule);
    }

    @Transactional
    @CacheEvict(value = "schedules", allEntries = true)
    public void updateSchedule(Long id, String userId, UpdateScheduleRequest request) {
        if (!request.departureTime().isBefore(request.arrivalTime())) {
            throw new IllegalArgumentException("Departure time must be before arrival time");
        }
        Optional<Route> optionalRoute = routeRepository.getDetailById(request.routeId());
        if(optionalRoute.isEmpty()){
            throw new RouteNotFoundException("Route Not Found");
        }
        Optional<Vehicle> optionalVehicle = vehicleRepository.getDetailWithSeatsById(request.vehicleId());
        if(optionalVehicle.isEmpty()){
            throw new VehicleNotFoundException("Vehicle Not Found");
        }
        Route route = optionalRoute.get();
        Vehicle vehicle = optionalVehicle.get();
        if(route.getStatus() != RouteStatus.ACTIVE){
            throw new IllegalStateException("Route Status is not active");
        }
        if(vehicle.getStatus() != VehicleStatus.ACTIVE){
            throw new IllegalStateException("Vehicle Status is not active");
        }
        if(!vehicle.getOperator().getUserId().equals(userId) || !route.getOperator().getUserId().equals(userId)){
            throw new AccessDeniedException("You not owned the vehicle or the route");
        }
        Schedule schedule = scheduleRepository.findById(id).orElseThrow(() -> new ScheduleNotFoundException("Schedule not found"));
        if(!schedule.getOperatorId().equals(vehicle.getOperator().getId())){
            throw new AccessDeniedException("You not owned the schedule");
        }
        schedule.setDepartureTime(request.departureTime());
        schedule.setArrivalTime(request.arrivalTime());
        schedule.setRoute(route);
        schedule.setVehicle(vehicle);
        schedule.setBasePrice(request.basePrice());
        schedule.setVipPrice(request.vipPrice());
        scheduleRepository.save(schedule);

    }

    @Transactional
    public void updateRunningSchedules() {
        scheduleRepository.updateRunningSchedules(LocalDateTime.now());
    }

    @Transactional
    public void updateCompletedSchedules() {
        LocalDateTime now = LocalDateTime.now();
        scheduleRepository.updateCompletedSchedules(now);
        bookingRepository.updateBookingPaidStatus(now);
    }
}
