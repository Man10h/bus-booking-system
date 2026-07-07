package com.Man10h.core_service.service;

import com.Man10h.core_service.model.request.CreateScheduleRequest;
import com.Man10h.core_service.model.request.ScheduleFilter;
import com.Man10h.core_service.model.response.ScheduleDetailResponse;
import com.Man10h.core_service.model.response.ScheduleSeatResponse;
import com.Man10h.core_service.model.response.ScheduleSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ScheduleService {
    public ScheduleSummaryResponse createSchedule(String userId, CreateScheduleRequest request);
    public Page<ScheduleSummaryResponse> findSchedules(ScheduleFilter filter, Pageable pageable);
    public List<ScheduleSeatResponse> getScheduleSeats(Long id);
    public ScheduleDetailResponse getScheduleDetail(Long id);
}
