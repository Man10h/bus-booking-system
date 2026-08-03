package com.Man10h.core_service.repository.spec;

import com.Man10h.core_service.model.entities.*;
import com.Man10h.core_service.model.enums.ScheduleStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class ScheduleSpecification {
    public static Specification<Schedule> operator(String operatorId){
        return (root, query, cb) -> {
          if(operatorId == null){
              return null;
          }
          return cb.equal(root.get("operatorId"), operatorId);
        };
    }

    public static Specification<Schedule> route(Long routeId){
        return (root, query, cb) -> {
            if(routeId == null){
                return null;
            }
            Join<Schedule, Route> routeJoin = root.join("route", JoinType.INNER);

            return cb.equal(routeJoin.get("id"), routeId);
        };
    }

    public static Specification<Schedule> status(String status){
        return (root, query, cb) -> {
            if(status == null || status.isBlank()){
                return null;
            }
            return cb.equal(root.get("status"), ScheduleStatus.valueOf(status));
        };
    }

    public static Specification<Schedule> departureTime(LocalDateTime departureTime){
        return (root, query, cb) -> {
            if(departureTime == null){
                return null;
            }
            return cb.greaterThanOrEqualTo(root.get("departureTime"), departureTime);
        };
    }

    public static Specification<Schedule> arrivalTime(LocalDateTime arrivalTime){
        return (root, query, cb) -> {
            if(arrivalTime == null){
                return null;
            }
            return cb.lessThanOrEqualTo(root.get("arrivalTime"), arrivalTime);
        };
    }

    public static Specification<Schedule> routeDepartureCity(Long departureCityId){
        return (root, query, cb) -> {
          if(departureCityId == null){
              return null;
          }
          Join<Schedule, Route> scheduleRouteJoin = root.join("route", JoinType.INNER);
          Join<Route, City> routeCityJoin = scheduleRouteJoin.join("departureCity", JoinType.INNER);

          return cb.equal(routeCityJoin.get("id"), departureCityId);
        };
    }


    public static Specification<Schedule> routeArrivalCity(Long routeArrivalCity){
        return (root, query, cb) -> {
            if(routeArrivalCity == null){
                return null;
            }
            Join<Schedule, Route> scheduleRouteJoin = root.join("route", JoinType.INNER);
            Join<Route, City> routeCityJoin = scheduleRouteJoin.join("arrivalCity", JoinType.INNER);

            return cb.equal(routeCityJoin.get("id"), routeArrivalCity);
        };
    }

    public static Specification<Schedule> vehicleType(Long vehicleTypeId){
        return ((root, query, cb) -> {
            if(vehicleTypeId == null){
                return null;
            }
            Join<Schedule, Vehicle> vehicleJoin = root.join("vehicle", JoinType.INNER);
            Join<Vehicle, VehicleType> vehicleTypeJoin = vehicleJoin.join("vehicleType", JoinType.INNER);
            return cb.equal(vehicleTypeJoin.get("id"), vehicleTypeId);
        });
    }
}
