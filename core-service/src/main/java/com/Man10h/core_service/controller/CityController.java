package com.Man10h.core_service.controller;

import com.Man10h.core_service.model.entities.City;
import com.Man10h.core_service.model.response.ApiResponse;
import com.Man10h.core_service.model.response.CityResponse;
import com.Man10h.core_service.repository.CityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RequestMapping("/core")
@RestController
@RequiredArgsConstructor
public class CityController {

    private final CityRepository cityRepository;

    @GetMapping("/cities")
    public ResponseEntity<ApiResponse<List<CityResponse>>> getAllCities() {
        List<CityResponse> data = cityRepository.findAll().stream()
                .map(city -> new CityResponse(city.getId(), city.getName(), city.getCode()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }
}
