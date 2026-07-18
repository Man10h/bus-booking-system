package com.Man10h.notification_service.repository;

import com.Man10h.notification_service.model.entities.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserIdAndIsRead(String userId, Boolean isRead, Pageable pageable);
}
