package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.Operator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OperatorRepository extends JpaRepository<Operator, String> {
    Optional<Operator> findByUserId(String userId);
    Boolean existsByUserId(String userId);

    boolean existsByTaxCode(String taxCode);
}
