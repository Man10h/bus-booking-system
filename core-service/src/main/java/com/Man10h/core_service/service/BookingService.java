package com.Man10h.core_service.service;

import com.Man10h.core_service.model.request.CreateBookingRequest;
import com.Man10h.core_service.model.response.BookingDetailResponse;
import com.Man10h.core_service.model.response.BookingSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookingService {
    public BookingSummaryResponse createBooking(String userId, CreateBookingRequest request);
    public BookingDetailResponse getBookingDetailById(String userId, Long bookingId);
    public Page<BookingSummaryResponse> getUserBookings(String userId, Pageable pageable);
    public BookingSummaryResponse getBookingById(Long bookingId);
}
