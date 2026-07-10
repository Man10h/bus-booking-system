package com.Man10h.core_service.scheduler;

import com.Man10h.core_service.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingScheduler {
    private final BookingService bookingService;

    @Scheduled(cron = "0 * * * * *")
    public void updateBookingCancelSchedule() {
        bookingService.updateBookingCancellation();
    }
}
