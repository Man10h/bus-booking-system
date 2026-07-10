package com.Man10h.core_service.scheduler;

import com.Man10h.core_service.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduleStatusScheduler {

    private final ScheduleService scheduleService;

    @Scheduled(cron = "0 * * * * *")
    public void updateScheduleStatus() {
        log.info("Start updating schedule status");

        scheduleService.updateRunningSchedules();
        scheduleService.updateCompletedSchedules();


        log.info("Finish updating schedule status");
    }
}
