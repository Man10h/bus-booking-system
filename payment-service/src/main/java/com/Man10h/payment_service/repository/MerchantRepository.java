package com.Man10h.payment_service.repository;

import com.Man10h.payment_service.model.entities.Merchant;
import com.Man10h.payment_service.model.enums.Provider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MerchantRepository extends JpaRepository<Merchant, String> {
    boolean existsByProviderAndOperatorId(Provider provider, String operatorId);
    boolean existsByMerchantCode(String merchantCode);
    Optional<Merchant> findByProviderAndOperatorId(Provider provider, String operatorId);
    Optional<Merchant> findByMerchantCode(String merchantCode);
}
