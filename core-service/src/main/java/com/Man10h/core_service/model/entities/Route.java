package com.Man10h.core_service.model.entities;

import com.Man10h.core_service.model.enums.RouteStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "route")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "route_seq_gen")
    @SequenceGenerator(name = "route_seq_gen", sequenceName = "route_id_seq", allocationSize = 50)
    private Long id;

    @Column(name = "route_code", nullable = false, unique = true)
    private String routeCode;

    @Column(name = "distance")
    private BigDecimal distance;

    @Column(name = "estimated_duration_minutes")
    private Long estimatedDurationMinutes;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private RouteStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private Operator operator;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RouteStop> routeStopList;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Schedule> scheduleList;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departure_city_id")
    private City departureCity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arrival_city_id")
    private City arrivalCity;
}
