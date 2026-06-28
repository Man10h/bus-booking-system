package com.Man10h.user_service.repository;

import com.Man10h.user_service.model.entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
}
