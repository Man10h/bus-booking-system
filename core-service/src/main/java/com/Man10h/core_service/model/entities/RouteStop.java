package com.Man10h.core_service.model.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "route_stop")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@NamedEntityGraphs(
        value = {
                @NamedEntityGraph(name = "routeStop.city", attributeNodes = {
                        @NamedAttributeNode("city")
                })
        }
)
public class RouteStop {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stop_order")
    private Long stopOrder;

    @Column(name = "stop_name")
    private String stopName;

    @Column(name = "distance_from_start")
    private BigDecimal distanceFromStart;

    @Column(name = "estimated_arrival_offset_minutes")
    private Long estimatedArrivalOffsetMinutes;

    @Column(name = "is_pickup")
    private Boolean isPickup;

    @Column(name = "is_drop_off")
    private Boolean isDropOff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city;
}
