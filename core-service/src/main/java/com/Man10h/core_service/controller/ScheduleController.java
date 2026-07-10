package com.Man10h.core_service.controller;

import com.Man10h.core_service.model.request.CreateScheduleRequest;
import com.Man10h.core_service.model.request.ScheduleFilter;
import com.Man10h.core_service.model.request.UpdateScheduleRequest;
import com.Man10h.core_service.model.response.*;
import com.Man10h.core_service.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/core")
@RestController
@RequiredArgsConstructor
public class ScheduleController {
    private final ScheduleService scheduleService;

    @PreAuthorize("hasRole('OPERATOR')")
    @PostMapping("/schedules")
    public ResponseEntity<ApiResponse<ScheduleSummaryResponse>> createSchedule(
            @RequestBody @Valid CreateScheduleRequest request,
            @AuthenticationPrincipal Jwt jwt
    ){
        ScheduleSummaryResponse data = scheduleService.createSchedule(jwt.getSubject(), request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 201));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PatchMapping("/schedules/{id}/cancel")
    public ResponseEntity<ApiResponse<?>> cancelSchedule(@PathVariable Long id,
                                                         @AuthenticationPrincipal Jwt jwt){
        scheduleService.cancelSchedule(jwt.getSubject(), id);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }

    @PutMapping("/schedules/{id}")
    public ResponseEntity<ApiResponse<?>> updateSchedule(@PathVariable Long id,
                                                         @AuthenticationPrincipal Jwt jwt,
                                                         @RequestBody @Valid UpdateScheduleRequest request){
        scheduleService.updateSchedule(id, jwt.getSubject(), request);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }

    @GetMapping("/schedules")
    public ResponseEntity<ApiResponse<Page<ScheduleSummaryResponse>>> findSchedules(
            @ModelAttribute ScheduleFilter scheduleFilter,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
            ){
        Page<ScheduleSummaryResponse> data = scheduleService.findSchedules(scheduleFilter, PageRequest.of(page, size));
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @GetMapping("/schedules/{id}")
    public ResponseEntity<ApiResponse<ScheduleDetailResponse>> getScheduleDetail(@PathVariable Long id){
        ScheduleDetailResponse data = scheduleService.getScheduleDetail(id);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }


    @GetMapping("/schedules/{id}/seats")
    public ResponseEntity<ApiResponse<List<ScheduleSeatResponse>>> getScheduleSeats(@PathVariable Long id){
        List<ScheduleSeatResponse> scheduleSeatResponseList = scheduleService.getScheduleSeats(id);
        return ResponseEntity.ok(new ApiResponse<>(scheduleSeatResponseList, "success", 200));
    }
}
