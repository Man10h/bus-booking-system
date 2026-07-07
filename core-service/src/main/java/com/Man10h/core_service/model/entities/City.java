package com.Man10h.core_service.model.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "city")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class City {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String code;
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "departureCity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Route> routeDepartureCityList;

    @OneToMany(mappedBy = "arrivalCity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Route> routeArrivalCityList;

    @OneToMany(mappedBy = "city", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RouteStop> routeStopList;
}
