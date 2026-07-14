package com.Man10h.core_service.model.response;

import java.math.BigDecimal;

public record StatisticalOverviewResponse (
        Long totalBookings,
        Long completedBookings,
        Long cancelledBookings,
        Long pendingBookings,

        BigDecimal todayRevenue,
        BigDecimal monthRevenue,
        BigDecimal totalRevenue,

        Long activeRoute,
        Long activeVehicle,
        Long openSchedule,
        Long runningSchedule
){
}
