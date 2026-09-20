package com.Man10h.core_service.repository;

import com.Man10h.core_service.model.entities.City;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface CityRepository extends JpaRepository<City, Long> {
    long countByIdIn(Collection<Long> ids);
}
