package com.Man10h.payment_service.model.entities;

import com.Man10h.payment_service.model.enums.OutboxStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "outbox_event")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OutboxEvent {
    @Id
    private String id;

    private String eventType;
    private String source;
    private String aggregateType;   // BOOKING
    private Long aggregateId;// bookingId

    @Column(columnDefinition = "jsonb")
    private String payload;

    @Enumerated(EnumType.STRING)
    private OutboxStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;

    private int retryCount;
    private String error;
}
