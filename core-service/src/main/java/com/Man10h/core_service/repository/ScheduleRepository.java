package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.Schedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ScheduleRepository extends JpaRepository<Schedule, Long>, Specification<Schedule> {
    @EntityGraph(attributePaths = {
            "vehicle",
            "route"
    })
    Page<Schedule> findAll(Specification<Schedule> spec, Pageable pageable);

    @EntityGraph(attributePaths = {
            "vehicle",
            "vehicle.vehicleType",
            "route",
            "route.arrivalCity",
            "route.departureCity",
            "route.routeStopList",
            "route.routeStopList.city"
    })
    @Query("""
    SELECT s FROM Schedule s WHERE s.id = :id
""")
    Optional<Schedule> getDetailById(@Param("id") Long id);


    @EntityGraph(attributePaths = {
            "scheduleSeatList",
    })
    @Query("""
    SELECT s FROM Schedule s WHERE s.id = :id
""")
    Optional<Schedule> getScheduleSeatsDetailById(@Param("id") Long id);
}
