package com.Man10h.payment_service.controller;

import com.Man10h.payment_service.controller.exceptions.*;
import com.Man10h.payment_service.model.response.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class ExceptionHandlers {

    @ExceptionHandler(MerchantNotFound.class)
    public ResponseEntity<ErrorResponse> merchantNotFound(MerchantNotFound e) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.NOT_FOUND.getReasonPhrase(),
                        HttpStatus.NOT_FOUND.value(),
                        e.getMessage(),
                        LocalDateTime.now()
                )
        );
    }


    @ExceptionHandler(InvalidAccessException.class)
    public ResponseEntity<ErrorResponse> invalidAccessException(InvalidAccessException e) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                        HttpStatus.UNAUTHORIZED.value(),
                        e.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(MerchantAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> merchantAlreadyExistsException(MerchantAlreadyExistsException e) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.CONFLICT.getReasonPhrase(),
                        HttpStatus.CONFLICT.value(),
                        e.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(InvalidBookingException.class)
    public ResponseEntity<ErrorResponse> invalidBookingException(InvalidBookingException e) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.BAD_REQUEST.getReasonPhrase(),
                        HttpStatus.BAD_REQUEST.value(),
                        e.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(MerchantInActiveException.class)
    public ResponseEntity<ErrorResponse> merchantInActiveException(MerchantInActiveException e) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.FORBIDDEN.getReasonPhrase(),
                        HttpStatus.FORBIDDEN.value(),
                        e.getMessage(),
                        LocalDateTime.now()
                )
        );
    }
}
