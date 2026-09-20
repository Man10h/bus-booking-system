package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.Route;
import com.Man10h.core_service.model.enums.RouteStatus;
import com.Man10h.core_service.model.enums.VehicleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RouteRepository extends JpaRepository<Route, Long>, JpaSpecificationExecutor<Route> {
    @EntityGraph(attributePaths = {
            "operator",
            "departureCity",
            "arrivalCity"
    })
    Page<Route> findAll(Specification<Route> spec, Pageable pageable);

    @Query("""
    SELECT r
    FROM Route r
    WHERE r.id = :id
""")
    @EntityGraph(attributePaths = {
            "operator",
            "departureCity",
            "arrivalCity",
            "routeStopList",
            "routeStopList.city"
    })
    Optional<Route> getDetailById(Long id);

    public Boolean existsByRouteCode(String routeCode);

    boolean existsByOperator_IdAndDepartureCity_IdAndArrivalCity_IdAndStatus(String operatorId, Long departureCityId, Long arrivalCityId, RouteStatus status);

    @Query("""
    SELECT COUNT(r) FROM Route r WHERE r.operator.id = :operatorId AND r.status = :status
""")
    Long getRouteCountByStatus(@Param("status") RouteStatus status,
                               @Param("operatorId") String operatorId);
}
