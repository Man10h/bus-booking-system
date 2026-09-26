package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SeatRepository extends JpaRepository<Seat, Long> {
    Optional<Seat> findByIdAndVehicle_Operator_UserId(Long id, String userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Seat s SET s.isVip = NOT s.isVip WHERE s.id = :id AND s.vehicle.operator.userId = :userId")
    int toggleSeatVipAtomic(@Param("id") Long id, @Param("userId") String userId);
}

