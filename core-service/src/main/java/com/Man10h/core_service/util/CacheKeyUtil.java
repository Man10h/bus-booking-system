package com.Man10h.core_service.util;

import com.Man10h.core_service.model.request.BookingFilter;
import com.Man10h.core_service.model.request.RouteFilter;
import com.Man10h.core_service.model.request.ScheduleFilter;
import org.springframework.data.domain.Pageable;


public class CacheKeyUtil {

    public static String scheduleKey(ScheduleFilter f, Pageable pageable) {
        return String.format(
                "o=%s:r=%s:dc=%s:ac=%s:dt=%s:at=%s:vt=%s:s=%s:p=%s",
                value(f.operatorId()),
                value(f.routeId()),
                value(f.departureCityId()),
                value(f.arrivalCityId()),
                value(f.departureTime()),
                value(f.arrivalTime()),
                value(f.vehicleTypeId()),
                value(f.status()),
                pageable.getPageNumber()
        );
    }

    public static String routeKey(RouteFilter filter, Pageable pageable) {
        return String.format(
                "dc=%s:ac=%s:op=%s:s=%s:p=%s",
                value(filter.departureCityId()),
                value(filter.arrivalCityId()),
                value(filter.operatorId()),
                value(filter.status()),
                pageable.getPageNumber()
        );
    }

    public static String bookingKey(BookingFilter filter, Pageable pageable){
        return String.format(
                "op=%s:dt=%s:at=%s:p=%s",
                value(filter.operatorId()),
                value(filter.departureTime()),
                value(filter.arrivalTime()),
                pageable.getPageNumber()
        );
    }

    private static Object value(Object o) {
        return o == null ? "_" : o;
    }
}
