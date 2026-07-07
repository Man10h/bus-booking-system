package com.Man10h.core_service.service;

import com.Man10h.core_service.model.request.CreateBookingRequest;

public interface BookingService {
    public void createBooking(String userId, CreateBookingRequest request);
}
