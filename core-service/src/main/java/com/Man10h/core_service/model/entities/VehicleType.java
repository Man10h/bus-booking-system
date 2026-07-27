package com.Man10h.core_service.model.entities;

import com.Man10h.core_service.model.enums.SeatType;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "vehicle_type")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VehicleType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seat_type")
    @Enumerated(EnumType.STRING)
    private SeatType seatType;

    @Column(name = "code")
    private String code;

    @Column(name = "name")
    private String name;

    @Column(name = "floors")
    private int floors;

    @Column(name = "rows")
    private int rows;

    @Column(name = "cols")
    private int cols;


    @OneToMany(mappedBy = "vehicleType", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vehicle> vehicles;
}
