package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.ScheduleSeat;
import com.Man10h.core_service.model.enums.ScheduleSeatStatus;
import com.Man10h.core_service.model.enums.ScheduleStatus;
import com.Man10h.core_service.model.enums.SeatStatus;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
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
    @QueryHints({
            @QueryHint(name = "jakarta.persistence.lock.timeout", value = "0")
    })
    @Query("""
    SELECT s
    FROM ScheduleSeat s
    WHERE s.schedule.id = :scheduleId
      AND s.id IN :seatIds
""")
    List<ScheduleSeat> findAllForUpdate(
            @Param("scheduleId") Long scheduleId,
            @Param("seatIds") List<Long> seatIds
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    SELECT s.id
    FROM ScheduleSeat s
    WHERE s.booking.id = :bookingId
""")
    List<Long> findScheduleSeatForUpdateBooking(
            @Param("bookingId") Long bookingId
    );

    @Modifying
    @Query("""
    UPDATE ScheduleSeat ss
    SET ss.status = :status
    WHERE ss.booking.id = :bookingId
""")
    void updateScheduleSeatStatusByBooking(
            @Param("status") ScheduleSeatStatus status,
            @Param("bookingId") Long bookingId
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
    UPDATE ScheduleSeat s
    SET s.status = :status,
        s.booking = :booking,
        s.heldBy = :userId,
        s.heldAt = :heldAt,
        s.expiredAt = :expiredAt
    WHERE s.id IN :seatIds
""")
    int holdSeatsBatch(
            @Param("status") ScheduleSeatStatus status,
            @Param("booking") com.Man10h.core_service.model.entities.Booking booking,
            @Param("userId") String userId,
            @Param("heldAt") LocalDateTime heldAt,
            @Param("expiredAt") LocalDateTime expiredAt,
            @Param("seatIds") List<Long> seatIds
    );

    boolean existsBySeat_IdAndStatusIn(Long seatId, List<ScheduleSeatStatus> seatStatuses);

    boolean existsBySeat_IdAndSchedule_StatusInAndStatusIn(Long seatId, List<ScheduleStatus> scheduleStatuses, List<ScheduleSeatStatus> statuses);

    boolean existsBySchedule_IdAndStatusIn(Long scheduleId, List<ScheduleSeatStatus> seatStatuses);

    @Modifying
    @Query(value = """
UPDATE schedule_seat ss
SET status = 'AVAILABLE',
    booking_id = NULL, held_by = NULL, held_at = NULL, expired_at = NULL
FROM booking b
WHERE ss.booking_id = b.id
  AND b.status = 'PENDING_PAYMENT'
  AND b.payment_deadline < :now
""", nativeQuery = true)
    int releaseExpiredSeats(@Param("now") LocalDateTime now);
}
