package com.Man10h.notification_service.controller;

import com.Man10h.notification_service.model.response.ApiResponse;
import com.Man10h.notification_service.model.response.NotificationResponse;
import com.Man10h.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @PreAuthorize("hasRole('USER')")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getUsersNotifications(@RequestParam(name = "page", defaultValue = "0") int page,
                                                                                         @RequestParam(name = "size", defaultValue = "10") int size,
                                                                                         @AuthenticationPrincipal Jwt jwt){
        Page<NotificationResponse> data = notificationService.getUsersNotifications(jwt.getSubject(), PageRequest.of(page, size));

        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('USER')")
    @PatchMapping("/{notificationId}/mark")
    public ResponseEntity<?> markNotificationAsRead(@PathVariable Long notificationId,
                                                    @AuthenticationPrincipal Jwt jwt) {
        notificationService.markNotificationAsRead(jwt.getSubject(), notificationId);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }
}
