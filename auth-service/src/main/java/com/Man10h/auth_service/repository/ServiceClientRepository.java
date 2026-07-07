package com.Man10h.auth_service.repository;

import com.Man10h.auth_service.model.entities.ServiceClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceClientRepository extends JpaRepository<ServiceClient, Long> {
    Optional<ServiceClient> findByClientId(String clientId);
}
