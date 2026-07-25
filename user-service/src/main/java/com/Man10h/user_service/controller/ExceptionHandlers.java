package com.Man10h.user_service.controller;

import com.Man10h.user_service.controller.exception.*;
import com.Man10h.user_service.model.response.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class ExceptionHandlers {

    @ExceptionHandler(AccountExistsException.class)
    public ResponseEntity<ErrorResponse> accountExistsException(AccountExistsException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                new ErrorResponse(
                        HttpStatus.CONFLICT.getReasonPhrase(),
                        HttpStatus.CONFLICT.value(),
                        e.getMessage(),
                        LocalDateTime.now()
                )
        );
    }


    @ExceptionHandler(RoleNotFoundException.class)
    public ResponseEntity<ErrorResponse> roleNotFoundException(RoleNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                new ErrorResponse(
                        HttpStatus.NOT_FOUND.getReasonPhrase(),
                        HttpStatus.NOT_FOUND.value(),
                        e.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> userNotFoundException(UserNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                new ErrorResponse(
                        HttpStatus.NOT_FOUND.getReasonPhrase(),
                        HttpStatus.NOT_FOUND.value(),
                        e.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(AccountEnabledException.class)
    public ResponseEntity<ErrorResponse> accountEnabledException(AccountEnabledException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                new ErrorResponse(
                        HttpStatus.CONFLICT.getReasonPhrase(),
                        HttpStatus.CONFLICT.value(),
                        e.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(AccountNotEnabledException.class)
    public ResponseEntity<ErrorResponse> accountNotEnabledException(AccountNotEnabledException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                new ErrorResponse(
                        HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                        HttpStatus.UNAUTHORIZED.value(),
                        e.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(AuthenticationFailedException.class)
    public ResponseEntity<ErrorResponse> authenticationFailedException(AuthenticationFailedException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                new ErrorResponse(
                        HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                        HttpStatus.UNAUTHORIZED.value(),
                        e.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(GlobalException.class)
    public ResponseEntity<ErrorResponse> globalException(GlobalException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ErrorResponse(
                        HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                        HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        e.getMessage(),
                        LocalDateTime.now()
                )
        );
    }
}
