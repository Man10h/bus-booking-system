package com.Man10h.notification_service.controller;

import com.Man10h.notification_service.controller.exceptions.AccessDeniedException;
import com.Man10h.notification_service.controller.exceptions.NotificationNotFoundException;
import com.Man10h.notification_service.model.response.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class ExceptionHandlers {

    @ExceptionHandler(NotificationNotFoundException.class)
    public ResponseEntity<ErrorResponse> notificationNotFound(NotificationNotFoundException ex) {
        return ResponseEntity.ok(new ErrorResponse(
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                LocalDateTime.now()
        ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> accessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.ok(new ErrorResponse(
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                HttpStatus.FORBIDDEN.value(),
                ex.getMessage(),
                LocalDateTime.now()
        ));
    }
}
