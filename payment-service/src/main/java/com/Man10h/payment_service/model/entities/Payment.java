package com.Man10h.payment_service.model.entities;

import com.Man10h.payment_service.model.enums.PaymentStatus;
import com.Man10h.payment_service.model.enums.Provider;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @Enumerated(EnumType.STRING)
    private Provider provider;
    private String transactionId;
    private String txnRef;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private Long bookingId;
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id")
    private Merchant merchant;
}
