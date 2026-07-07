package com.Man10h.payment_service.model.entities;

import com.Man10h.payment_service.model.enums.Provider;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "merchant")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Merchant {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String operatorId;

    // VNPAY, MOMO...
    @Enumerated(EnumType.STRING)
    private Provider provider;

    // Mã merchant
    private String merchantCode;

    // Secret để ký
    private String secretKey;

    private Boolean active;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "merchant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Payment> payments;
}
