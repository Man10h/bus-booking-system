package com.Man10h.core_service.service.impl;

import com.Man10h.core_service.controller.exception.BookingNotFoundException;
import com.Man10h.core_service.controller.exception.GlobalException;
import com.Man10h.core_service.controller.exception.OperatorNotFoundException;
import com.Man10h.core_service.controller.exception.ScheduleNotFoundException;
import com.Man10h.core_service.model.entities.Booking;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.model.entities.Schedule;
import com.Man10h.core_service.model.entities.ScheduleSeat;
import com.Man10h.core_service.model.enums.*;
import com.Man10h.core_service.model.request.BookingFilter;
import com.Man10h.core_service.model.request.CreateBookingRequest;
import com.Man10h.core_service.model.request.StatisticFilter;
import com.Man10h.core_service.model.response.*;
import com.Man10h.core_service.repository.*;
import com.Man10h.core_service.service.BookingService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.Man10h.core_service.repository.spec.BookingSpecification.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    @Value("${kafka.topics.booking-ready}")
    private String bookingReadyTopic;

    private final BookingRepository bookingRepository;
    private final ScheduleSeatRepository scheduleSeatRepository;
    private final ScheduleRepository scheduleRepository;
    private final OperatorRepository operatorRepository;
    private final RouteRepository routeRepository;
    private final VehicleRepository vehicleRepository;
    private final ObjectMapper objectMapper;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public BookingSummaryResponse toBookingSummaryResponse(Booking booking){
        return new BookingSummaryResponse(
                booking.getId(),
                booking.getUserId(),
                booking.getOperatorId(),
                booking.getBookingCode(),
                booking.getTotalAmount(),
                booking.getPaymentDeadline(),
                booking.getCreateAt(),
                booking.getStatus()
        );
    }

    public BookingDetailResponse toBookingDetailResponse(Booking booking){
        Schedule schedule = booking.getSchedule();
        ScheduleSummaryResponse scheduleSummaryResponse = new ScheduleSummaryResponse(schedule.getId(), schedule.getOperatorId(),schedule.getDepartureTime(), schedule.getArrivalTime(), schedule.getBasePrice(), schedule.getVipPrice(), schedule.getAvailableSeats(), schedule.getStatus(),schedule.getTotalSeats());
        List<ScheduleSeatResponse> scheduleSeatResponseList =
                booking.getScheduleSeatList()
                        .stream()
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
        return new BookingDetailResponse(
                booking.getId(),
                booking.getUserId(),
                booking.getOperatorId(),
                booking.getBookingCode(),
                booking.getTotalAmount(),
                booking.getPaymentDeadline(),
                booking.getCreateAt(),
                booking.getStatus(),
                scheduleSummaryResponse,
                scheduleSeatResponseList
        );
    }

    @Transactional
    public BookingSummaryResponse createBooking(String userId, CreateBookingRequest request) {
        Optional<Schedule> optionalSchedule = scheduleRepository.findById(request.scheduleId());
        if(optionalSchedule.isEmpty()){
            throw new ScheduleNotFoundException("Schedule not found");
        }
        if(optionalSchedule.get().getStatus() != ScheduleStatus.OPEN){
            throw new IllegalArgumentException("Schedule is not OPEN");
        }
        List<ScheduleSeat> scheduleSeatList =  scheduleSeatRepository.findAllForUpdate(request.scheduleId(), request.scheduleSeatIds());
        if(scheduleSeatList.size() != request.scheduleSeatIds().size()) {
            throw new IllegalArgumentException("Schedule seats do not match");
        }

        BigDecimal totalPrice = BigDecimal.ZERO;
        for(ScheduleSeat scheduleSeat : scheduleSeatList) {
            if(!scheduleSeat.getStatus().equals(ScheduleSeatStatus.AVAILABLE)){
                throw new IllegalArgumentException("Seat is no longer available");
            }
            totalPrice = totalPrice.add(scheduleSeat.getPrice());
        }


        LocalDateTime now = LocalDateTime.now();
        Booking booking = Booking.builder()
                .userId(userId)
                .bookingCode(UUID.randomUUID().toString())
                .createAt(now)
                .operatorId(optionalSchedule.get().getOperatorId())
                .status(BookingStatus.PENDING_PAYMENT)
                .schedule(optionalSchedule.get())
                .paymentDeadline(now.plusMinutes(30))
                .scheduleSeatList(new ArrayList<>())
                .totalAmount(totalPrice)
                .notified(false)
                .build();
        for(ScheduleSeat scheduleSeat : scheduleSeatList) {
            scheduleSeat.setStatus(ScheduleSeatStatus.HELD);
            scheduleSeat.setBooking(booking);
            scheduleSeat.setHeldBy(userId);
            scheduleSeat.setHeldAt(now);
            scheduleSeat.setExpiredAt(now.plusMinutes(30));
            scheduleSeatRepository.save(scheduleSeat);
        }
        booking.setScheduleSeatList(scheduleSeatList);

        bookingRepository.save(booking);

        return toBookingSummaryResponse(booking);
    }

    @Override
    public BookingDetailResponse getBookingDetailById(String userId, Long id) {
        Optional<Booking> optional = bookingRepository.getBookingDetailByIdAndUserId(id, userId);
        if(optional.isEmpty()){
            throw new BookingNotFoundException("Booking not found");
        }
        return toBookingDetailResponse(optional.get());
    }

    @Override
    public Page<BookingSummaryResponse> getUserBookings(String userId, Pageable pageable) {
        return bookingRepository.findByUserId(userId, pageable)
                .map(this::toBookingSummaryResponse);
    }

    @Override
    public BookingSummaryResponse getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId).map(this::toBookingSummaryResponse)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found"));
    }

    @Transactional
    public void cancelBooking(String userId, Long bookingId) {
        Booking booking = bookingRepository.getBookingDetailByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found"));

        if(booking.getStatus() != BookingStatus.PENDING_PAYMENT){
            throw new IllegalStateException("Booking is not PENDING_PAYMENT");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        booking.getScheduleSeatList().forEach(seat -> {
            seat.setStatus(ScheduleSeatStatus.AVAILABLE);
            seat.setHeldBy(null);
            seat.setHeldAt(null);
            seat.setExpiredAt(null);
            seat.setBooking(null);
            scheduleSeatRepository.save(seat);
        });
        booking.getScheduleSeatList().clear();
        bookingRepository.save(booking);
    }

    @Cacheable(value = "bookings", key = "T(com.Man10h.core_service.util.CacheKeyUtil).bookingKey(#bookingFilter, #pageable)")
    @Override
    public BookingPageResponse findUserBookingsByFilter(String userId, BookingFilter bookingFilter, Pageable pageable) {
        Specification<Booking> spec = Specification.allOf(
                user(userId),
                operator(bookingFilter.operatorId()),
                departureTime(bookingFilter.departureTime()),
                arrivalTime(bookingFilter.arrivalTime())
        );
        Page<BookingSummaryResponse> page = bookingRepository.findAll(spec, pageable)
                .map(this::toBookingSummaryResponse);
        return new BookingPageResponse(
                page.getContent(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
        );
    }

    @Override
    public StatisticalOverviewResponse getStatisticalOverview(String userId) {
        Operator operator = operatorRepository.findByUserId(userId)
                        .orElseThrow(() -> new OperatorNotFoundException("Operator not found"));
        LocalDate today = LocalDate.now();

        LocalDateTime startDay = today.atStartOfDay();
        LocalDateTime endDay = startDay.plusDays(1);
        LocalDateTime startMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endMonth = startMonth.plusMonths(1L);

        Long totalBooking = bookingRepository.getTotalOperatorsBooking(operator.getId());
        Long completedBookings = bookingRepository.getTotalOperatorsStatusBooking(operator.getId(), BookingStatus.COMPLETED);
        Long cancelledBookings = bookingRepository.getTotalOperatorsStatusBooking(operator.getId(), BookingStatus.CANCELLED);
        Long pendingBookings = bookingRepository.getTotalOperatorsStatusBooking(operator.getId(), BookingStatus.PENDING_PAYMENT);

        BigDecimal totalRevenue = bookingRepository.getTotalRevenue(operator.getId(), BookingStatus.COMPLETED);
        BigDecimal todayRevenue = bookingRepository.getRevenueIn(operator.getId(), BookingStatus.COMPLETED, startDay, endDay);
        BigDecimal monthRevenue = bookingRepository.getRevenueIn(operator.getId(), BookingStatus.COMPLETED, startMonth, endMonth);


        Long activeRoute = routeRepository.getRouteCountByStatus(RouteStatus.ACTIVE, operator.getId());
        Long activeVehicle = vehicleRepository.getVehicleCountByStatus(VehicleStatus.ACTIVE, operator.getId());
        Long openSchedule = scheduleRepository.getScheduleCountByStatus(ScheduleStatus.OPEN, operator.getId());
        Long runningSchedule = scheduleRepository.getScheduleCountByStatus(ScheduleStatus.RUNNING, operator.getId());
        return new StatisticalOverviewResponse(
                totalBooking,
                completedBookings,
                cancelledBookings,
                pendingBookings,
                totalRevenue,
                monthRevenue,
                todayRevenue,
                activeRoute,
                activeVehicle,
                openSchedule,
                runningSchedule
        );
    }

    @Override
    public List<TimeStatisticResponse> getTimeStatistic(String userId, StatisticFilter statisticFilter) {
        Operator operator = operatorRepository.findByUserId(userId)
                .orElseThrow(() -> new OperatorNotFoundException("Operator not found"));
        return statisticFilter.statisticType() == StatisticType.DAY ?
                bookingRepository.statisticByDayFromStartToEnd(operator.getId(), BookingStatus.COMPLETED, statisticFilter.from().atStartOfDay(), statisticFilter.to().atStartOfDay().plusDays(1)):
                bookingRepository.statisticByMonthFromStartToEnd(operator.getId(), BookingStatus.COMPLETED, statisticFilter.from().withDayOfMonth(1).atStartOfDay(), statisticFilter.to().withDayOfMonth(1).atStartOfDay().plusMonths(1L))
                ;
    }

    @Override
    public List<TopRouteResponse> getTopRoutes(String userId) {
        Operator operator = operatorRepository.findByUserId(userId)
                .orElseThrow(() -> new OperatorNotFoundException("Operator not found"));
        return bookingRepository.topRoutes(operator.getId(), BookingStatus.COMPLETED);
    }

    @Override
    public List<TopVehicleResponse> getTopVehicles(String userId) {
        Operator operator = operatorRepository.findByUserId(userId)
                .orElseThrow(() -> new OperatorNotFoundException("Operator not found"));
        return bookingRepository.topVehicles(operator.getId(), BookingStatus.COMPLETED);
    }


    @Transactional
    public void updateBookingPaidStatus(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found"));
        booking.setStatus(BookingStatus.PAID);
        bookingRepository.save(booking);
    }



    @Transactional
    public void updateBookingCancellation() {
        LocalDateTime now = LocalDateTime.now();
        scheduleSeatRepository.releaseExpiredSeats(now);

        bookingRepository.updateBookingStatus(now);
    }

    @Transactional
    public void notifyUpcomingBooking() {
        LocalDateTime from = LocalDateTime.now().plusMinutes(15);
        LocalDateTime to = from.plusMinutes(5);
        List<Long> bookingIds = new ArrayList<>();
        bookingRepository.getRemindersResponse(from, to, BookingStatus.PAID)
                 .forEach(reminder -> {
                     try {
                         kafkaTemplate.send(bookingReadyTopic, objectMapper.writeValueAsString(reminder))
                                 .whenComplete((r, e) -> {
                                     if (e != null) {
                                         log.error("Failed to send reminder: {}", reminder.bookingCode(), e);
                                     } else {
                                         log.info("Reminder sent: {}", reminder.bookingCode());
                                     }
                                 });
                     } catch (JsonProcessingException e) {
                         throw new GlobalException(e.getMessage());
                     }
                     bookingIds.add(reminder.bookingId());
                 });
        bookingRepository.markReminderSent(bookingIds);
    }
}
