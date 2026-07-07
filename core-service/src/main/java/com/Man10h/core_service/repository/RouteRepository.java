package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.Route;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

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
}
