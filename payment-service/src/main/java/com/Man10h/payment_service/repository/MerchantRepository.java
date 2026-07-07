package com.Man10h.payment_service.repository;

import com.Man10h.payment_service.model.entities.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MerchantRepository extends JpaRepository<Merchant, String> {
}
