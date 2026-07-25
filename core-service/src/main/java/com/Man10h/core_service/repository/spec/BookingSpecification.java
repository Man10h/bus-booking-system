package com.Man10h.core_service.repository.spec;

import com.Man10h.core_service.model.entities.Booking;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class BookingSpecification {
    public static Specification<Booking> user(String userId) {
        return (root, query, cb) -> {
            if(userId == null){
                return null;
            }
            return cb.equal(root.get("userId"), userId);
        };
    }

    public static Specification<Booking> operator(String operatorId){
        return (root, query, cb) -> {
          if(operatorId == null || operatorId.isBlank()){
              return null;
          }
          return cb.equal(root.get("operatorId"), operatorId);
        };
    }

    public static Specification<Booking> departureTime(LocalDateTime departureTime) {
        return (root, query, cb) -> {
            if(departureTime == null){
                return null;
            }
            return cb.greaterThanOrEqualTo(root.get("schedule").get("departureTime"), departureTime);
        };
    }

    public static Specification<Booking> arrivalTime(LocalDateTime arrivalTime) {
        return (root, query, cb) -> {
            if(arrivalTime == null){
                return null;
            }
            return cb.lessThanOrEqualTo(root.get("schedule").get("arrivalTime"), arrivalTime);
        };
    }
}
