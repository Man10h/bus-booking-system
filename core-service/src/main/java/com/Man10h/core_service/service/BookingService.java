package com.Man10h.core_service.service;

import com.Man10h.core_service.model.request.BookingFilter;
import com.Man10h.core_service.model.request.CreateBookingRequest;
import com.Man10h.core_service.model.request.StatisticFilter;
import com.Man10h.core_service.model.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BookingService {
    public BookingSummaryResponse createBooking(String userId, CreateBookingRequest request);
    public BookingDetailResponse getBookingDetailById(String userId, Long bookingId);
    public Page<BookingSummaryResponse> getUserBookings(String userId, Pageable pageable);
    public BookingSummaryResponse getBookingById(Long bookingId);
    public void cancelBooking(String userId, Long bookingId);
    public BookingPageResponse findUserBookingsByFilter(String userId, BookingFilter bookingFilter, Pageable pageable);

    public void updateBookingPaidStatus(Long bookingId);
    public void updateBookingCancellation();
    public void notifyUpcomingBooking();

    public StatisticalOverviewResponse getStatisticalOverview(String userId);
    public List<TimeStatisticResponse> getTimeStatistic(String userId, StatisticFilter statisticFilter);
    public List<TopRouteResponse> getTopRoutes(String userId);
    public List<TopVehicleResponse> getTopVehicles(String userId);
}
