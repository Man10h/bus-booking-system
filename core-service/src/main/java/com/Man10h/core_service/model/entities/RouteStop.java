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

    private Long stopOrder;
    private String stopName;
    private BigDecimal distanceFromStart;
    private Long estimatedArrivalOffsetMinutes;
    private Boolean isPickup;
    private Boolean isDropOff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city;
}
