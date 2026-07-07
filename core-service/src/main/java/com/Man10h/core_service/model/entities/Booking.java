package com.Man10h.core_service.model.entities;


import com.Man10h.core_service.model.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "booking")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String bookingCode;
    private String userId;

    private BigDecimal totalAmount;
    private LocalDateTime paymentDeadline;
    private LocalDateTime createAt;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleSeat> scheduleSeatList;

    @ManyToOne
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;
}
