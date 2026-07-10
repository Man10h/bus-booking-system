package com.Man10h.core_service.kafka;

import com.Man10h.core_service.model.response.PaymentResponse;
import com.Man10h.core_service.service.BookingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PaymentEventConsumer {

    private final BookingService bookingService;

    @KafkaListener(
            topics = "${kafka.topics.payment-success}",
            groupId = "core-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void onPaymentSuccess(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try{
            PaymentResponse paymentResponse = new ObjectMapper().readValue(record.value(), PaymentResponse.class);
            bookingService.updateBookingPaidStatus(paymentResponse.bookingId());

            ack.acknowledge();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
