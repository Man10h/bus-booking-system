package com.Man10h.core_service.service;

import com.Man10h.core_service.model.request.CreateScheduleRequest;
import com.Man10h.core_service.model.request.ScheduleFilter;
import com.Man10h.core_service.model.request.UpdateScheduleRequest;
import com.Man10h.core_service.model.response.ScheduleDetailResponse;
import com.Man10h.core_service.model.response.SchedulePageResponse;
import com.Man10h.core_service.model.response.ScheduleSeatResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ScheduleService {
    public ScheduleDetailResponse createSchedule(String userId, CreateScheduleRequest request);
    public SchedulePageResponse findSchedules(ScheduleFilter filter, Pageable pageable);
    public List<ScheduleSeatResponse> getScheduleSeats(Long id);
    public ScheduleDetailResponse getScheduleDetail(Long id);
    public void cancelSchedule(String userId, Long id);
    public void updateSchedule(Long id, String userId, UpdateScheduleRequest request);
    void updateRunningSchedules();
    void updateCompletedSchedules();
}
