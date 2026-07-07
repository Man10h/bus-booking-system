package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
}
