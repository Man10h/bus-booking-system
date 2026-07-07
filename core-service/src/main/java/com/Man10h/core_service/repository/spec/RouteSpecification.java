package com.Man10h.core_service.repository.spec;

import com.Man10h.core_service.model.entities.City;
import com.Man10h.core_service.model.entities.Operator;
import com.Man10h.core_service.model.entities.Route;
import com.Man10h.core_service.model.enums.RouteStatus;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

public class RouteSpecification {
    public static Specification<Route> arrivalCity(Long arrivalCityId) {
        return (root, query, cb) -> {
            if(arrivalCityId == null) {
                return null;
            }
            Join<Route, City> arrivalCity = root.join("arrivalCity");

            return cb.equal(arrivalCity.get("id"), arrivalCityId);
        };
    }

    public static Specification<Route> departureCity(Long departureCityId) {
        return (root, query, cb) -> {
            if(departureCityId == null) {
                return null;
            }
            Join<Route, City> departureCity = root.join("departureCity");

            return cb.equal(departureCity.get("id"), departureCityId);
        };
    }

    public static Specification<Route> operator(String operatorId) {
        return (root, query, cb) -> {
            if(operatorId == null){
                return null;
            }
            Join<Route, Operator> operator = root.join("operator");

            return cb.equal(operator.get("id"), operatorId);
        };
    }

    public static Specification<Route> status(RouteStatus status) {
        return (root, query, cb) -> {
            if (status == null) {
                return null;
            }
            return cb.equal(root.get("status"), status);
        };
    }
}
