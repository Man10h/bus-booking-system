package com.Man10h.core_service.repository.spec;

import com.Man10h.core_service.model.entities.VehicleType;
import com.Man10h.core_service.model.enums.SeatType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public class VehicleTypeSpecification {

    public static Specification<VehicleType> keyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return null;
            }
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            Predicate namePredicate = cb.like(cb.lower(root.get("name")), pattern);
            Predicate codePredicate = cb.like(cb.lower(root.get("code")), pattern);
            return cb.or(namePredicate, codePredicate);
        };
    }

    public static Specification<VehicleType> seatType(String seatType) {
        return (root, query, cb) -> {
            if (seatType == null || seatType.isBlank()) {
                return null;
            }
            try {
                SeatType st = SeatType.valueOf(seatType.trim().toUpperCase());
                return cb.equal(root.get("seatType"), st);
            } catch (IllegalArgumentException e) {
                return null;
            }
        };
    }

    public static Specification<VehicleType> floors(Integer floors) {
        return (root, query, cb) -> {
            if (floors == null) {
                return null;
            }
            return cb.equal(root.get("floors"), floors);
        };
    }
}
