package com.Man10h.payment_service.repository;


import com.Man10h.payment_service.model.entities.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, String> {
}
