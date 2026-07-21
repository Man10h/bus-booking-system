package com.Man10h.core_service.kafka;

import com.Man10h.core_service.model.response.PaymentResponse;
import com.Man10h.core_service.service.BookingService;
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
public class PaymentConsumer {

    private final BookingService bookingService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = "${kafka.topics.payment-success}",
            groupId = "core-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void onPaymentSuccess(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try{
            PaymentResponse paymentResponse = objectMapper.readValue(record.value(), PaymentResponse.class);
            bookingService.updateBookingPaidStatus(paymentResponse.bookingId());

            ack.acknowledge();
        } catch (Exception e) {
            log.error(e.getMessage());
        }
    }
}
