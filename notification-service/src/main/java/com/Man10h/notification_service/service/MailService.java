package com.Man10h.notification_service.service;

public interface MailService {
    void sendMail(String to, String subject, String content);
    public String buildEmailTemplate(String title, String message);
}
