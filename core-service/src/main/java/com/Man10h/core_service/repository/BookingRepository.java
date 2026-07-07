package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @EntityGraph(attributePaths = {
            "schedule",
            "scheduleSeatList"
    })
    @Query("""
    SELECT b FROM Booking b WHERE b.userId = :userId AND b.id = :id
""")
    Optional<Booking> getBookingDetailByIdAndUserId(@Param("id") Long id, @Param("userId") String userId);

    Page<Booking> findByUserId(String userId, Pageable pageable);
}
