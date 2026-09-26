package com.Man10h.core_service.model.entities;

import com.Man10h.core_service.model.enums.VehicleStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.Set;

@Entity
@Table(name = "vehicle")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "vehicle_seq_gen")
    @SequenceGenerator(name = "vehicle_seq_gen", sequenceName = "vehicle_id_seq", allocationSize = 1)
    private Long id;

    @Column(name = "license_plate", unique = true)
    private String licensePlate;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "brand")
    private String brand;

    @Column(name = "model")
    private String model;

    @Column(name = "total_seats")
    private Long totalSeats;

    @Column(name = "description")
    private String description;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private VehicleStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private Operator operator;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Schedule> scheduleList;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_type_id")
    private VehicleType vehicleType;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Seat> vehicleSeatList;

}
