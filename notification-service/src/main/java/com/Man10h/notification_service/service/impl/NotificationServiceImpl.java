package com.Man10h.notification_service.service.impl;

import com.Man10h.notification_service.controller.exceptions.AccessDeniedException;
import com.Man10h.notification_service.controller.exceptions.NotificationNotFoundException;
import com.Man10h.notification_service.model.entities.Notification;
import com.Man10h.notification_service.model.response.NotificationResponse;
import com.Man10h.notification_service.repository.NotificationRepository;
import com.Man10h.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void createAndSendNotification(String userId, String content, String targetCode) {
        Notification notification = Notification.builder()
                .content(content)
                .targetCode(targetCode)
                .userId(userId)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();
        notificationRepository.save(notification);


        NotificationResponse notificationResponse = new NotificationResponse(
                notification.getId(),
                notification.getUserId(),
                notification.getContent(),
                notification.getIsRead(),
                notification.getCreatedAt(),
                notification.getTargetCode()
        );

        messagingTemplate.convertAndSendToUser(notification.getUserId(),"/user/notifications", notificationResponse);

    }

    @Override
    public Page<NotificationResponse> getUsersNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByUserIdAndIsRead(userId, false, pageable)
                .map(notification ->  new NotificationResponse(
                        notification.getId(),
                        notification.getUserId(),
                        notification.getContent(),
                        notification.getIsRead(),
                        notification.getCreatedAt(),
                        notification.getTargetCode()
                ));
    }

    @Transactional
    public void markNotificationAsRead(String userId, Long notificationId) {
        Optional<Notification> optional = notificationRepository.findById(notificationId);
        if (optional.isEmpty()){
            throw new NotificationNotFoundException("Notification not found");
        }
        if(!optional.get().getUserId().equals(userId)){
            throw new AccessDeniedException("Access denied");
        }
        Notification notification = optional.get();
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }
}
