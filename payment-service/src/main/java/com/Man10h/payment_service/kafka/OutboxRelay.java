package com.Man10h.payment_service.kafka;

import com.Man10h.payment_service.model.enums.OutboxStatus;
import com.Man10h.payment_service.repository.OutboxRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class OutboxRelay {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final OutboxRepository outboxRepository;

    @Scheduled(cron = "0 * * * * *")
    public void relay(){
        outboxRepository.findByStatus(OutboxStatus.PENDING)
                .forEach(event -> {
                    kafkaTemplate
                            .send(event.getEventType(), String.valueOf(event.getAggregateId()), event.getPayload())
                            .whenComplete((result, ex) -> {
                                if (ex == null) {
                                    event.setStatus(OutboxStatus.PUBLISHED);
                                    event.setPublishedAt(LocalDateTime.now());
                                    outboxRepository.save(event);
                                }
                                else {
                                    if(event.getRetryCount() < 5){
                                        event.setRetryCount(event.getRetryCount() + 1);
                                    }
                                    else {
                                        event.setStatus(OutboxStatus.FAILED);
                                    }
                                    event.setError(ex.getMessage());
                                }
                                outboxRepository.save(event);
                            });
                });
    }

}
