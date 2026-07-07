package com.Man10h.core_service.service.impl;

import com.Man10h.core_service.controller.exception.AccessDeniedException;
import com.Man10h.core_service.controller.exception.RouteNotFoundException;
import com.Man10h.core_service.controller.exception.ScheduleNotFoundException;
import com.Man10h.core_service.controller.exception.VehicleNotFoundException;
import com.Man10h.core_service.model.entities.*;
import com.Man10h.core_service.model.enums.*;
import com.Man10h.core_service.model.request.CreateScheduleRequest;
import com.Man10h.core_service.model.request.ScheduleFilter;
import com.Man10h.core_service.model.response.*;
import com.Man10h.core_service.repository.RouteRepository;
import com.Man10h.core_service.repository.ScheduleRepository;
import com.Man10h.core_service.repository.ScheduleSeatRepository;
import com.Man10h.core_service.repository.VehicleRepository;
import com.Man10h.core_service.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.Man10h.core_service.repository.spec.ScheduleSpecification.*;


@Service
@RequiredArgsConstructor
public class ScheduleServiceImpl implements ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final VehicleRepository vehicleRepository;
    private final RouteRepository routeRepository;
    private final ScheduleSeatRepository scheduleSeatRepository;

    public VehicleResponse toVehicleResponse(Vehicle vehicle) {
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
        return new RouteDetailResponse(
                route.getId(),
                route.getRouteCode(),
                route.getDistance(),
                route.getEstimatedDurationMinutes(),
                route.getStatus(),
                route.getOperator().getCompanyName(),
                route.getArrivalCity().getName(),
                route.getDepartureCity().getName(),
                routeStopResponseList
        );
    }

    public ScheduleSummaryResponse toSummaryResponse(Schedule schedule) {
        return new ScheduleSummaryResponse(schedule.getId(), schedule.getDepartureTime(), schedule.getArrivalTime(), schedule.getBasePrice(), schedule.getVipPrice(), schedule.getAvailableSeats(), schedule.getStatus().toString(),schedule.getTotalSeats());
    }

    public ScheduleDetailResponse toDetailResponse(Schedule schedule) {
        return new ScheduleDetailResponse(
            schedule.getId(),
            schedule.getDepartureTime(),
            schedule.getArrivalTime(),
            schedule.getBasePrice(),
            schedule.getVipPrice(),
            schedule.getAvailableSeats(),
            schedule.getTotalSeats(),
            schedule.getStatus().toString(),
            toVehicleResponse(schedule.getVehicle()),
            toRouteDetailResponse(schedule.getRoute())

        );
    }

    @Transactional
    public ScheduleSummaryResponse createSchedule(String userId, CreateScheduleRequest request) {
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
        if(route.getStatus().equals(RouteStatus.INACTIVE)){
            throw new IllegalStateException("Route Status is Inactive");
        }
        if(vehicle.getStatus().equals(VehicleStatus.MAINTENANCE)){
            throw new IllegalStateException("Vehicle Status is Maintenance");
        }
        if(!vehicle.getOperator().getId().equals(userId) || !route.getOperator().getId().equals(userId)){
            throw new AccessDeniedException("You not owned the vehicle or the route");
        }
        Schedule schedule = Schedule.builder()
                .route(route)
                .vehicle(vehicle)
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
                if(!seat.getIsVip()){
                    ScheduleSeat scheduleSeat = ScheduleSeat.builder()
                            .seat(seat)
                            .schedule(schedule)
                            .price(request.basePrice())
                            .status(ScheduleSeatStatus.AVAILABLE)
                            .build();
                }
                ScheduleSeat scheduleSeat = ScheduleSeat.builder()
                        .seat(seat)
                        .schedule(schedule)
                        .price(request.vipPrice())
                        .status(ScheduleSeatStatus.AVAILABLE)
                        .build();
                scheduleSeatList.add(scheduleSeat);
            }
        }
        schedule.setAvailableSeats((long) scheduleSeatList.size());
        schedule.setScheduleSeatList(scheduleSeatList);
        scheduleRepository.save(schedule);
        return toSummaryResponse(schedule);
    }

    @Override
    public Page<ScheduleSummaryResponse> findSchedules(ScheduleFilter filter, Pageable pageable) {

        Specification<Schedule> spec = Specification.allOf(
                route(filter.routeId()),
                routeDepartureCity(filter.departureCityId()),
                routeArrivalCity(filter.arrivalCityId()),
                departureTime(filter.departureTime()),
                arrivalTime(filter.arrivalTime()),
                vehicleType(filter.vehicleTypeId()),
                status(filter.status())
        );
        return scheduleRepository.findAll(spec, pageable).map(this::toSummaryResponse);
    }

    @Override
    public List<ScheduleSeatResponse> getScheduleSeats(Long id) {
        List<ScheduleSeat> scheduleSeatList = scheduleSeatRepository.findBySchedule_Id(id);

        return scheduleSeatList.stream()
                .filter(scheduleSeat -> !scheduleSeat.getSeat().getStatus().equals(SeatStatus.INACTIVE))
                .map(
                scheduleSeat -> {
                    return new ScheduleSeatResponse(
                            scheduleSeat.getId(),
                            scheduleSeat.getPrice(),
                            scheduleSeat.getHeldBy(),
                            scheduleSeat.getHeldAt(),
                            scheduleSeat.getExpiredAt(),
                            scheduleSeat.getStatus().toString(),
                            new SeatResponse(
                                    scheduleSeat.getSeat().getId(),
                                    scheduleSeat.getSeat().getSeatNumber(),
                                    scheduleSeat.getSeat().getFloor(),
                                    scheduleSeat.getSeat().getRow(),
                                    scheduleSeat.getSeat().getCol(),
                                    scheduleSeat.getSeat().getSeatType().toString(),
                                    scheduleSeat.getSeat().getStatus().toString(),
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
}
