package com.Man10h.payment_service.model.event;

import java.time.LocalDateTime;
import java.util.UUID;

public record EventMessage<T>(
        UUID eventId,
        String eventType,
        String source,
        LocalDateTime publishedAt,
        T payload
) {}