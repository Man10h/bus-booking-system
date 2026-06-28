package com.Man10h.auth_service.repository;

import com.Man10h.auth_service.model.entities.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenAndRevoked(String token, Boolean revoked);
}
