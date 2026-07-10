package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.Schedule;
import com.Man10h.core_service.model.enums.ScheduleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ScheduleRepository extends JpaRepository<Schedule, Long>, JpaSpecificationExecutor<Schedule> {
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


    @Query("""
SELECT COUNT(s) > 0
FROM Schedule s
WHERE s.vehicle.id = :vehicleId
AND s.status <> com.Man10h.core_service.model.enums.ScheduleStatus.CANCELLED
AND s.departureTime < :arrivalTime
AND s.arrivalTime > :departureTime
""")
    boolean existsOverlappingSchedule(
            Long vehicleId,
            LocalDateTime departureTime,
            LocalDateTime arrivalTime
    );

    @Modifying
    @Query("""
UPDATE Schedule s
SET s.status = com.Man10h.core_service.model.enums.ScheduleStatus.RUNNING
WHERE s.status = com.Man10h.core_service.model.enums.ScheduleStatus.OPEN
AND s.departureTime <= :now
""")
    int updateRunningSchedules(LocalDateTime now);


    @Modifying
    @Query("""
UPDATE Schedule s
SET s.status = com.Man10h.core_service.model.enums.ScheduleStatus.COMPLETED
WHERE s.status = com.Man10h.core_service.model.enums.ScheduleStatus.RUNNING
AND s.arrivalTime <= :now
""")
    int updateCompletedSchedules(LocalDateTime now);


    boolean existsByRoute_IdAndStatusIn(Long routeId, List<ScheduleStatus> scheduleStatuses);
    boolean existsByVehicle_IdAndStatusIn(Long vehicleId, List<ScheduleStatus> scheduleStatuses);


}
