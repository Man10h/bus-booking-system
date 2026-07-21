package com.Man10h.core_service.util;

import com.Man10h.core_service.model.request.RouteFilter;
import com.Man10h.core_service.model.request.ScheduleFilter;

public class CacheKeyUtil {

    public static String scheduleKey(ScheduleFilter f) {
        return String.format(
                "r=%s:dc=%s:ac=%s:dt=%s:at=%s:vt=%s:s=%s",
                value(f.routeId()),
                value(f.departureCityId()),
                value(f.arrivalCityId()),
                value(f.departureTime()),
                value(f.arrivalTime()),
                value(f.vehicleTypeId()),
                value(f.status())
        );
    }

    public static String routeKey(RouteFilter filter) {
        return String.format(
                "dc=%s:ac=%s:op=%s:s=%s",
                value(filter.departureCityId()),
                value(filter.arrivalCityId()),
                value(filter.operatorId()),
                value(filter.status())
        );
    }


    private static Object value(Object o) {
        return o == null ? "_" : o;
    }
}
