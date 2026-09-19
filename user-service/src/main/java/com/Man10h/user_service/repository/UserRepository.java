package com.Man10h.user_service.repository;

import com.Man10h.user_service.model.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor<User> {
    public boolean existsByEmail(String email);

    @Query("""
        SELECT u FROM User u 
        LEFT JOIN FETCH u.role r 
        WHERE u.email = :email
""")
    public Optional<User> findByEmail(@Param(value = "email") String email);


    @Query("""
        SELECT u FROM User u 
        LEFT JOIN FETCH u.role r 
        WHERE u.email = :email
""")
    public Optional<User> loadUserByEmail(String email);

    Page<User> findAll(Pageable pageable);
}
