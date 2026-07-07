package com.Man10h.auth_service.controller;

import com.Man10h.auth_service.controller.exception.*;

import com.Man10h.auth_service.model.response.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class ExceptionHandlers {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.BAD_REQUEST.getReasonPhrase(),
                        HttpStatus.BAD_REQUEST.value(),
                        ex.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(AuthenticationFailedException.class)
    public ResponseEntity<ErrorResponse> authenticationFailedException(AuthenticationFailedException ex) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                        HttpStatus.UNAUTHORIZED.value(),
                        ex.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(GlobalException.class)
    public ResponseEntity<ErrorResponse> globalException(GlobalException ex) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                        HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        ex.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<ErrorResponse> invalidTokenException(InvalidTokenException ex) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                        HttpStatus.UNAUTHORIZED.value(),
                        ex.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(InvalidClientIdException.class)
    public ResponseEntity<ErrorResponse> invalidClientException(InvalidClientIdException ex) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                        HttpStatus.UNAUTHORIZED.value(),
                        ex.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(InvalidSecretException.class)
    public ResponseEntity<ErrorResponse> invalidSecretException(InvalidSecretException ex) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                        HttpStatus.UNAUTHORIZED.value(),
                        ex.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(ServiceClientNotFoundException.class)
    public ResponseEntity<ErrorResponse> serviceClientNotFoundException(ServiceClientNotFoundException ex) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                        HttpStatus.UNAUTHORIZED.value(),
                        ex.getMessage(),
                        LocalDateTime.now()
                )
        );
    }

    @ExceptionHandler(InvalidScopeException.class)
    public ResponseEntity<ErrorResponse> invalidScopeException(InvalidScopeException ex) {
        return ResponseEntity.ok(
                new ErrorResponse(
                        HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                        HttpStatus.UNAUTHORIZED.value(),
                        ex.getMessage(),
                        LocalDateTime.now()
                )
        );
    }


}
