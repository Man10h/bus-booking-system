package com.Man10h.auth_service.repository;

import com.Man10h.auth_service.model.entities.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenAndRevoked(String token, Boolean revoked);

    Optional<RefreshToken> findByToken(String token);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE refresh_token r SET r.revoked = true WHERE r.userId = :userId")
    void revokeAllUserTokens(@org.springframework.data.repository.query.Param("userId") String userId);
}
