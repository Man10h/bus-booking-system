package com.Man10h.payment_service.repository;


import com.Man10h.payment_service.model.entities.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    Optional<Payment> findByTxnRef(String txnRef);
    Page<Payment> findByUserId(String userId, Pageable pageable);

}
