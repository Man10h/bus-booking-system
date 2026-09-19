package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.Booking;
import com.Man10h.core_service.model.entities.Route;
import com.Man10h.core_service.model.enums.BookingStatus;
import com.Man10h.core_service.model.response.DepartureReminderResponse;
import com.Man10h.core_service.model.response.TimeStatisticResponse;
import com.Man10h.core_service.model.response.TopRouteResponse;
import com.Man10h.core_service.model.response.TopVehicleResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    @EntityGraph(attributePaths = {
            "schedule"
    })
    Optional<Booking> findById(Long bookingId);

    @EntityGraph(attributePaths = {
            "schedule",
            "scheduleSeatList"
    })
    @Query("""
    SELECT b FROM Booking b WHERE b.userId = :userId AND b.id = :id
""")
    Optional<Booking> getBookingDetailByIdAndUserId(@Param("id") Long id, @Param("userId") String userId);

    Page<Booking> findAll(Specification<Booking> spec, Pageable pageable);

    Page<Booking> findByUserId(String userId, Pageable pageable);

    @Modifying
    @Query("""
       UPDATE Booking b 
       SET b.status = com.Man10h.core_service.model.enums.BookingStatus.CANCELLED
       WHERE b.status = com.Man10h.core_service.model.enums.BookingStatus.PENDING_PAYMENT 
       AND b.paymentDeadline < :now
""")
    int updateBookingStatus(@Param("now") LocalDateTime now);


    @Modifying
    @Query("""
    UPDATE Booking b
    SET b.status = com.Man10h.core_service.model.enums.BookingStatus.COMPLETED
    WHERE b.status = com.Man10h.core_service.model.enums.BookingStatus.PAID 
    AND b.schedule.arrivalTime <= :now
""")
    int updateBookingPaidStatus(@Param("now") LocalDateTime now);


    @Query("""
    SELECT COUNT(b) FROM Booking b WHERE b.operatorId = :operatorId 
""")
    Long getTotalOperatorsBooking(@Param("operatorId") String operatorId);


    @Query("""
    SELECT COUNT(b) FROM Booking b WHERE b.operatorId = :operatorId AND b.status = :status
""")
    Long getTotalOperatorsStatusBooking(@Param("operatorId") String operatorId, @Param("status") BookingStatus status);


    @Query("""
    SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE b.operatorId = :operatorId AND b.status = :status
""")
    BigDecimal getTotalRevenue(@Param("operatorId") String operatorId, @Param("status") BookingStatus status);


    @Query("""
    SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b 
    WHERE b.operatorId = :operatorId 
    AND b.status = :status 
    AND b.createAt >= :start
    AND b.createAt < :end
""")
    BigDecimal getRevenueIn(@Param("operatorId") String operatorId,
                            @Param("status") BookingStatus status,
                            @Param("start") LocalDateTime start,
                            @Param("end")LocalDateTime end);


    @Query("""
SELECT new com.Man10h.core_service.model.response.TimeStatisticResponse(
    CAST(FUNCTION('DATE_TRUNC', 'day', b.createAt) AS string),
    SUM(b.totalAmount)
)
FROM Booking b
WHERE b.operatorId = :operatorId
AND b.status = :status
AND b.createAt >= :start
AND b.createAt < :end
GROUP BY FUNCTION('DATE_TRUNC', 'day', b.createAt)
ORDER BY FUNCTION('DATE_TRUNC', 'day', b.createAt)
""")
    List<TimeStatisticResponse> statisticByDayFromStartToEnd(
            @Param("operatorId") String operatorId,
            @Param("status") BookingStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);


    @Query("""
SELECT new com.Man10h.core_service.model.response.TimeStatisticResponse(
    CAST(FUNCTION('DATE_TRUNC', 'month', b.createAt) AS string),
    SUM(b.totalAmount)
)
FROM Booking b
WHERE b.operatorId = :operatorId
AND b.status = :status
AND b.createAt >= :start
AND b.createAt < :end
GROUP BY FUNCTION('DATE_TRUNC', 'month', b.createAt)
ORDER BY FUNCTION('DATE_TRUNC', 'month', b.createAt)
""")
    List<TimeStatisticResponse> statisticByMonthFromStartToEnd(
            @Param("operatorId") String operatorId,
            @Param("status") BookingStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);



    @Query("""
    SELECT 
    new com.Man10h.core_service.model.response.TopVehicleResponse(v.id, v.licensePlate, SUM(b.totalAmount)) 
    FROM Booking b
    JOIN b.schedule s
    JOIN s.vehicle v
    WHERE b.operatorId = :operatorId AND b.status = :status
    GROUP BY v.id, v.licensePlate
    ORDER BY SUM(b.totalAmount)
""")
    List<TopVehicleResponse> topVehicles(@Param("operatorId") String operatorId,
                                         @Param("status") BookingStatus status);

    @Query("""
    SELECT 
    new com.Man10h.core_service.model.response.TopRouteResponse(r.id, r.routeCode, SUM(b.totalAmount)) 
    FROM Booking b
    JOIN b.schedule s
    JOIN s.route r
    WHERE b.operatorId = :operatorId AND b.status = :status
    GROUP BY r.id, r.routeCode
    ORDER BY SUM(b.totalAmount)
""")
    List<TopRouteResponse> topRoutes(@Param("operatorId") String operatorId,
                                     @Param("status") BookingStatus status);


    @Query("""
    SELECT new com.Man10h.core_service.model.response.DepartureReminderResponse(b.id, b.userId, b.bookingCode) FROM Booking b
    JOIN b.schedule s
    WHERE  s.departureTime >= :from 
    AND s.departureTime < :to
    AND b.status = :status 
    AND b.notified = false
""")
    List<DepartureReminderResponse> getRemindersResponse(@Param("from") LocalDateTime from,
                                                         @Param("to") LocalDateTime to,
                                                         @Param("status") BookingStatus status);
    @Modifying
    @Query("""
    UPDATE Booking b 
    SET b.notified = true
    WHERE b.id IN :ids
""")
    int markReminderSent(@Param("ids") List<Long> ids);
}
