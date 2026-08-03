package com.Man10h.notification_service.kafka;

import com.Man10h.notification_service.model.response.UserVerificationResponse;
import com.Man10h.notification_service.service.MailService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserConsumer {

    private final ObjectMapper objectMapper;
    private final MailService mailService;

    @KafkaListener(
            topics = "${kafka.topics.user-register-success}",
            containerFactory = "kafkaListenerContainerFactory",
            groupId = "notification-service-group"
    )
    public void onUserRegisterSuccess(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            UserVerificationResponse userVerificationResponse = objectMapper.readValue(record.value(), UserVerificationResponse.class);
            String content = mailService.buildEmailTemplate("Verify account", String.format("Your verification code is %s. This code will expire at %s", userVerificationResponse.verificationCode(), userVerificationResponse.verificationExpiryDate()));

            mailService.sendMail(userVerificationResponse.email(), "verify-account", content);
            ack.acknowledge();
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
