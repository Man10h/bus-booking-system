package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.VehicleType;
import jakarta.persistence.Entity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface VehicleTypeRepository extends JpaRepository<VehicleType, Long>, JpaSpecificationExecutor<VehicleType> {
    @EntityGraph(attributePaths = {
            "vehicles"
    })
    Optional<VehicleType> getVehicleTypeById(Long id);
}
