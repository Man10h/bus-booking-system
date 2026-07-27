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

    @Column(name = "booking_code", nullable = false, unique = true)
    private String bookingCode;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "payment_deadline")
    private LocalDateTime paymentDeadline;

    @Column(name = "create_at")
    private LocalDateTime createAt;

    @Column(name = "operator_id", nullable = false)
    private String operatorId;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    @Column(name = "notified")
    private Boolean notified;

    @OneToMany(mappedBy = "booking")
    private List<ScheduleSeat> scheduleSeatList;

    @ManyToOne
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;
}
