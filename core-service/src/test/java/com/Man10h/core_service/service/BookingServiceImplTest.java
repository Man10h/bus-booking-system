package com.Man10h.core_service.service;

import com.Man10h.core_service.controller.exception.BookingNotFoundException;
import com.Man10h.core_service.controller.exception.ScheduleNotFoundException;
import com.Man10h.core_service.model.entities.Booking;
import com.Man10h.core_service.model.entities.Schedule;
import com.Man10h.core_service.model.entities.ScheduleSeat;
import com.Man10h.core_service.model.entities.Seat;
import com.Man10h.core_service.model.enums.BookingStatus;
import com.Man10h.core_service.model.enums.ScheduleSeatStatus;
import com.Man10h.core_service.model.enums.ScheduleStatus;
import com.Man10h.core_service.model.enums.SeatStatus;
import com.Man10h.core_service.model.enums.SeatType;
import com.Man10h.core_service.model.request.CreateBookingRequest;
import com.Man10h.core_service.model.response.BookingSummaryResponse;
import com.Man10h.core_service.repository.*;
import com.Man10h.core_service.service.impl.BookingServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private ScheduleSeatRepository scheduleSeatRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private OperatorRepository operatorRepository;
    @Mock
    private RouteRepository routeRepository;
    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private Schedule openSchedule;
    private ScheduleSeat availableSeat1;
    private ScheduleSeat availableSeat2;
    private Seat physicalSeat1;
    private Seat physicalSeat2;

    @BeforeEach
    void setUp() {
        openSchedule = Schedule.builder()
                .id(100L)
                .operatorId("op-uuid-1")
                .status(ScheduleStatus.OPEN)
                .departureTime(LocalDateTime.now().plusDays(1))
                .arrivalTime(LocalDateTime.now().plusDays(1).plusHours(5))
                .basePrice(BigDecimal.valueOf(200000))
                .vipPrice(BigDecimal.valueOf(300000))
                .availableSeats(20L)
                .totalSeats(20L)
                .build();

        physicalSeat1 = Seat.builder()
                .id(1L)
                .seatNumber("A01")
                .floor(1L)
                .row(1L)
                .col(1L)
                .seatType(SeatType.SEAT)
                .isVip(false)
                .status(SeatStatus.ACTIVE)
                .build();

        physicalSeat2 = Seat.builder()
                .id(2L)
                .seatNumber("A02")
                .floor(1L)
                .row(1L)
                .col(2L)
                .seatType(SeatType.SEAT)
                .isVip(true)
                .status(SeatStatus.ACTIVE)
                .build();

        availableSeat1 = ScheduleSeat.builder()
                .id(10L)
                .schedule(openSchedule)
                .seat(physicalSeat1)
                .price(BigDecimal.valueOf(200000))
                .status(ScheduleSeatStatus.AVAILABLE)
                .build();

        availableSeat2 = ScheduleSeat.builder()
                .id(11L)
                .schedule(openSchedule)
                .seat(physicalSeat2)
                .price(BigDecimal.valueOf(300000))
                .status(ScheduleSeatStatus.AVAILABLE)
                .build();
    }

    @Nested
    @DisplayName("Create Booking Unit Tests")
    class CreateBookingTests {

        @Test
        @DisplayName("Should successfully create booking when seats are available")
        void createBooking_Success() {
            // Arrange
            String userId = "user-123";
            CreateBookingRequest request = new CreateBookingRequest(100L, List.of(10L, 11L));

            when(scheduleRepository.findById(100L)).thenReturn(Optional.of(openSchedule));
            when(scheduleSeatRepository.findAllForUpdate(100L, List.of(10L, 11L)))
                    .thenReturn(List.of(availableSeat1, availableSeat2));
            when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            BookingSummaryResponse response = bookingService.createBooking(userId, request);

            // Assert
            assertNotNull(response);
            assertEquals(userId, response.getUserId());
            assertEquals(BookingStatus.PENDING_PAYMENT, response.getStatus());
            assertEquals(BigDecimal.valueOf(500000), response.getTotalAmount());
            assertEquals(ScheduleSeatStatus.HELD, availableSeat1.getStatus());
            assertEquals(ScheduleSeatStatus.HELD, availableSeat2.getStatus());
            assertEquals(userId, availableSeat1.getHeldBy());

            verify(scheduleSeatRepository, times(2)).save(any(ScheduleSeat.class));
            verify(bookingRepository, times(1)).save(any(Booking.class));
        }

        @Test
        @DisplayName("Should throw ScheduleNotFoundException when schedule does not exist")
        void createBooking_ScheduleNotFound() {
            String userId = "user-123";
            CreateBookingRequest request = new CreateBookingRequest(999L, List.of(10L));
            when(scheduleRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ScheduleNotFoundException.class, () -> bookingService.createBooking(userId, request));
            verify(scheduleSeatRepository, never()).findAllForUpdate(any(), any());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when schedule is not OPEN")
        void createBooking_ScheduleNotOpen() {
            openSchedule.setStatus(ScheduleStatus.RUNNING);
            CreateBookingRequest request = new CreateBookingRequest(100L, List.of(10L));
            when(scheduleRepository.findById(100L)).thenReturn(Optional.of(openSchedule));

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                    () -> bookingService.createBooking(userIdOrNull("user-1"), request));
            assertEquals("Schedule is not OPEN", exception.getMessage());
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when any seat is no longer AVAILABLE")
        void createBooking_SeatAlreadyHeld() {
            availableSeat1.setStatus(ScheduleSeatStatus.HELD);
            CreateBookingRequest request = new CreateBookingRequest(100L, List.of(10L));

            when(scheduleRepository.findById(100L)).thenReturn(Optional.of(openSchedule));
            when(scheduleSeatRepository.findAllForUpdate(100L, List.of(10L)))
                    .thenReturn(List.of(availableSeat1));

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                    () -> bookingService.createBooking("user-1", request));
            assertEquals("Seat is no longer available", exception.getMessage());
        }
    }

    @Nested
    @DisplayName("Pessimistic Concurrency & Lock Simulation")
    class ConcurrencyTests {

        @Test
        @DisplayName("Simulate 10 concurrent requests for the exact same seat: Exactly 1 succeeds, 9 fail")
        void concurrentBookingForSameSeat() throws InterruptedException {
            int numberOfThreads = 10;
            ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
            CountDownLatch latch = new CountDownLatch(1);
            AtomicInteger successCount = new AtomicInteger(0);
            AtomicInteger failureCount = new AtomicInteger(0);

            Object lock = new Object();
            when(scheduleRepository.findById(100L)).thenReturn(Optional.of(openSchedule));
            when(scheduleSeatRepository.findAllForUpdate(eq(100L), eq(List.of(10L))))
                    .thenAnswer(invocation -> {
                        synchronized (lock) {
                            ScheduleSeat seat = ScheduleSeat.builder()
                                    .id(availableSeat1.getId())
                                    .price(availableSeat1.getPrice())
                                    .status(availableSeat1.getStatus())
                                    .schedule(availableSeat1.getSchedule())
                                    .seat(availableSeat1.getSeat())
                                    .build();
                            if (availableSeat1.getStatus() == ScheduleSeatStatus.AVAILABLE) {
                                availableSeat1.setStatus(ScheduleSeatStatus.HELD);
                            }
                            return List.of(seat);
                        }
                    });

            when(scheduleSeatRepository.save(any(ScheduleSeat.class))).thenAnswer(invocation -> {
                ScheduleSeat seat = invocation.getArgument(0);
                synchronized (availableSeat1) {
                    availableSeat1.setStatus(seat.getStatus());
                }
                return seat;
            });

            when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

            for (int i = 0; i < numberOfThreads; i++) {
                final String user = "user-" + i;
                executorService.submit(() -> {
                    try {
                        latch.await(); // Synchronize all threads to start simultaneously
                        bookingService.createBooking(user, new CreateBookingRequest(100L, List.of(10L)));
                        successCount.incrementAndGet();
                    } catch (Exception e) {
                        failureCount.incrementAndGet();
                    }
                });
            }

            latch.countDown(); // Release threads
            executorService.shutdown();
            assertTrue(executorService.awaitTermination(5, TimeUnit.SECONDS));

            assertEquals(1, successCount.get(), "Exactly 1 booking request must succeed");
            assertEquals(9, failureCount.get(), "9 booking requests must fail due to seat unavailability");
        }
    }

    @Nested
    @DisplayName("Cancel & Update Status Unit Tests")
    class CancelAndStatusTests {

        @Test
        @DisplayName("Should update booking paid status successfully")
        void updateBookingPaidStatus_Success() {
            Booking booking = Booking.builder()
                    .id(50L)
                    .status(BookingStatus.PENDING_PAYMENT)
                    .build();

            when(bookingRepository.findById(50L)).thenReturn(Optional.of(booking));

            bookingService.updateBookingPaidStatus(50L);

            assertEquals(BookingStatus.PAID, booking.getStatus());
            verify(bookingRepository, times(1)).save(booking);
        }

        @Test
        @DisplayName("Should throw BookingNotFoundException when booking does not exist during update")
        void updateBookingPaidStatus_NotFound() {
            when(bookingRepository.findById(99L)).thenReturn(Optional.empty());

            assertThrows(BookingNotFoundException.class, () -> bookingService.updateBookingPaidStatus(99L));
        }

        @Test
        @DisplayName("Should cancel PENDING_PAYMENT booking and release held seats")
        void cancelBooking_Success() {
            String userId = "user-123";
            Booking booking = Booking.builder()
                    .id(50L)
                    .userId(userId)
                    .status(BookingStatus.PENDING_PAYMENT)
                    .scheduleSeatList(new ArrayList<>(List.of(availableSeat1)))
                    .build();
            availableSeat1.setStatus(ScheduleSeatStatus.HELD);
            availableSeat1.setHeldBy(userId);

            when(bookingRepository.getBookingDetailByIdAndUserId(50L, userId)).thenReturn(Optional.of(booking));

            bookingService.cancelBooking(userId, 50L);

            assertEquals(BookingStatus.CANCELLED, booking.getStatus());
            assertEquals(ScheduleSeatStatus.AVAILABLE, availableSeat1.getStatus());
            assertNull(availableSeat1.getHeldBy());
            verify(scheduleSeatRepository, times(1)).save(availableSeat1);
        }
    }

    private String userIdOrNull(String val) {
        return val;
    }
}
