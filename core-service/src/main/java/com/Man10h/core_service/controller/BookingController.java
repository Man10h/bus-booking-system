package com.Man10h.core_service.controller;

import com.Man10h.core_service.model.request.BookingFilter;
import com.Man10h.core_service.model.request.CreateBookingRequest;
import com.Man10h.core_service.model.response.ApiResponse;
import com.Man10h.core_service.model.response.BookingDetailResponse;
import com.Man10h.core_service.model.response.BookingPageResponse;
import com.Man10h.core_service.model.response.BookingSummaryResponse;
import com.Man10h.core_service.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/core")
@RestController
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;


    @PreAuthorize("hasRole('USER')")
    @PostMapping("/bookings")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> createBooking(@RequestBody @Valid CreateBookingRequest request,
                                                                             @AuthenticationPrincipal Jwt jwt) {
        BookingSummaryResponse data = bookingService.createBooking(jwt.getSubject(), request);

        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/bookings/me/{id}")
    public ResponseEntity<ApiResponse<BookingDetailResponse>> getUserBooking(@PathVariable Long id,
                                                                         @AuthenticationPrincipal Jwt jwt) {
        BookingDetailResponse data = bookingService.getBookingDetailById(jwt.getSubject(), id);

        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/bookings/me")
    public ResponseEntity<ApiResponse<BookingPageResponse>> getUsersBookings(@AuthenticationPrincipal Jwt jwt,
                                                                             @ModelAttribute BookingFilter bookingFilter,
                                                                             @RequestParam(name = "page", defaultValue = "0") int page,
                                                                             @RequestParam(name = "size", defaultValue = "10") int size) {
        BookingPageResponse data = bookingService.findUserBookingsByFilter(jwt.getSubject(), bookingFilter, PageRequest.of(page, size));

        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasAnyAuthority('SCOPE_core.read')")
    @GetMapping("/bookings/{id}")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> getBookingById(@PathVariable Long id) {
        BookingSummaryResponse data = bookingService.getBookingById(id);

        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('USER')")
    @PatchMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<?>> cancelBooking(@AuthenticationPrincipal Jwt jwt, @PathVariable Long bookingId) {
        bookingService.cancelBooking(jwt.getSubject(), bookingId);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }
}
