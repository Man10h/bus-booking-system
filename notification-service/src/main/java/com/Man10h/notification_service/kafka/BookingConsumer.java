package com.Man10h.notification_service.kafka;

import com.Man10h.notification_service.model.response.DepartureReminderResponse;
import com.Man10h.notification_service.service.NotificationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingConsumer {
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    @KafkaListener(
            topics = "${kafka.topics.booking-ready}",
            groupId = "notification-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void onBookingReady(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            DepartureReminderResponse response = objectMapper.readValue(record.value(), DepartureReminderResponse.class);
            notificationService.createAndSendNotification(response.userId(), "Your booking is ready in a few minutes.", response.bookingCode());
        } catch (JsonProcessingException e) {
            log.error(e.getMessage());
        }
    }
}
