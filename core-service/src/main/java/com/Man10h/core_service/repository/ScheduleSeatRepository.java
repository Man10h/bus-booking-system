package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.ScheduleSeat;
import com.Man10h.core_service.model.enums.ScheduleSeatStatus;
import com.Man10h.core_service.model.enums.ScheduleStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
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

    boolean existsBySeat_IdAndStatusIn(Long seatId, List<ScheduleSeatStatus> seatStatuses);

    boolean existsBySeat_IdAndSchedule_StatusInAndStatusIn(Long seatId, List<ScheduleStatus> scheduleStatuses, List<ScheduleSeatStatus> statuses);

    boolean existsBySchedule_IdAndStatusIn(Long scheduleId, List<ScheduleSeatStatus> seatStatuses);

    @Modifying
    @Query(value = """
UPDATE schedule_seat ss
SET status = 'AVAILABLE',
    booking_id = NULL
FROM booking b
WHERE ss.booking_id = b.id
  AND b.status = 'PENDING_PAYMENT'
  AND b.payment_deadline < :now
""", nativeQuery = true)
    int releaseExpiredSeats(@Param("now") LocalDateTime now);
}
