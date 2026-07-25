package com.Man10h.notification_service.kafka;

import com.Man10h.notification_service.model.response.PaymentResponse;
import com.Man10h.notification_service.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PaymentConsumer {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    @KafkaListener(
            topics = "${kafka.topics.payment-success}",
            groupId = "notification-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void onPaymentSuccess(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try{
            PaymentResponse paymentResponse = objectMapper.readValue(record.value(), PaymentResponse.class);
            //create notification + send
            notificationService.createAndSendNotification(paymentResponse.userId(), String.format("The #%s payment is successful.", paymentResponse.txnRef()), paymentResponse.txnRef());
            ack.acknowledge();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}