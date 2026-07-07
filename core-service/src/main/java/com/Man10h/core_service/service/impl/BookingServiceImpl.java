package com.Man10h.core_service.service.impl;

import com.Man10h.core_service.controller.exception.ScheduleNotFoundException;
import com.Man10h.core_service.model.entities.Booking;
import com.Man10h.core_service.model.entities.Schedule;
import com.Man10h.core_service.model.entities.ScheduleSeat;
import com.Man10h.core_service.model.enums.BookingStatus;
import com.Man10h.core_service.model.enums.ScheduleSeatStatus;
import com.Man10h.core_service.model.request.CreateBookingRequest;
import com.Man10h.core_service.repository.BookingRepository;
import com.Man10h.core_service.repository.ScheduleRepository;
import com.Man10h.core_service.repository.ScheduleSeatRepository;
import com.Man10h.core_service.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ScheduleSeatRepository scheduleSeatRepository;
    private final ScheduleRepository scheduleRepository;


    @Transactional
    public void createBooking(String userId, CreateBookingRequest request) {
        Optional<Schedule> optionalSchedule = scheduleRepository.findById(request.scheduleId());
        if(optionalSchedule.isEmpty()){
            throw new ScheduleNotFoundException("Schedule not found");
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
                .status(BookingStatus.PENDING_PAYMENT)
                .schedule(optionalSchedule.get())
                .paymentDeadline(now.plusMinutes(30))
                .scheduleSeatList(new ArrayList<>())
                .totalAmount(totalPrice)
                .build();
        for(ScheduleSeat scheduleSeat : scheduleSeatList) {
            scheduleSeat.setStatus(ScheduleSeatStatus.HELD);
            scheduleSeat.setBooking(booking);
        }
        booking.setScheduleSeatList(scheduleSeatList);

        bookingRepository.save(booking);
    }
}
