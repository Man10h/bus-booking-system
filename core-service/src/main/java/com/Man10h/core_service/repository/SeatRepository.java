package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SeatRepository extends JpaRepository<Seat, Long> {
    Optional<Seat> findByIdAndVehicle_Operator_UserId(Long id, String userId);
}
