package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.Vehicle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    @Query("""
    SELECT v FROM Vehicle v WHERE v.id = :id
""")
    @EntityGraph(attributePaths = {
            "operator",
            "vehicleType"
    })
    Optional<Vehicle> getDetailById(@Param("id") Long id);


    @Query("""
    SELECT v FROM Vehicle v 
    LEFT JOIN FETCH v.operator o
    LEFT JOIN FETCH v.vehicleType vt
    WHERE o.userId = :id
""")
    Page<Vehicle> getOperatorsVehicles(@Param("id") String userId, Pageable pageable);

    @Query("""
    SELECT v FROM Vehicle v WHERE v.id = :id
""")
    @EntityGraph(attributePaths = {
            "operator",
            "vehicleType",
            "vehicleSeatList"
    })
    Optional<Vehicle> getDetailWithSeatsById(@Param("id") Long id);


}
