package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.ScheduleSeat;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ScheduleSeatRepository extends JpaRepository<ScheduleSeat, Long> {

    @EntityGraph(attributePaths = {
            "seat"
    })
    public List<ScheduleSeat> findBySchedule_Id(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    SELECT s
    FROM ScheduleSeat s
    WHERE s.schedule.id = :scheduleId
      AND s.id IN :seatIds
""")
    List<ScheduleSeat> findAllForUpdate(
            Long scheduleId,
            List<Long> seatIds
    );
}
