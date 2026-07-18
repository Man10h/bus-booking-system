package com.Man10h.notification_service.service;

import com.Man10h.notification_service.model.response.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    public void createAndSendNotification(String userId, String content, String targetCode);
    public Page<NotificationResponse> getUsersNotifications(String userId, Pageable pageable);
    public void markNotificationAsRead(String userId, Long notificationId);
}
