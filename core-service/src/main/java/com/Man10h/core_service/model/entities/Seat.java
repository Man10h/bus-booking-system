package com.Man10h.core_service.model.entities;

import com.Man10h.core_service.model.enums.SeatStatus;
import com.Man10h.core_service.model.enums.SeatType;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.Set;

@Entity
@Table(name = "seat")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Seat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seat_number")
    private String seatNumber;

    @Column(name = "floor")
    private Long floor;

    @Column(name = "row")
    private Long row;

    @Column(name = "col")
    private Long col;

    @Column(name = "is_vip")
    private Boolean isVip;


    @Column(name = "seat_type")
    @Enumerated(EnumType.STRING)
    private SeatType seatType;


    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private SeatStatus status;

    @OneToMany(mappedBy = "seat", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleSeat> scheduleSeatList;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;
}
