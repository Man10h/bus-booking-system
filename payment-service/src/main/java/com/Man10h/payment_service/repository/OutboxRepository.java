package com.Man10h.payment_service.repository;

import com.Man10h.payment_service.model.entities.OutboxEvent;
import com.Man10h.payment_service.model.enums.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OutboxRepository extends JpaRepository<OutboxEvent, String> {
    List<OutboxEvent> findByStatus(OutboxStatus status);
}
