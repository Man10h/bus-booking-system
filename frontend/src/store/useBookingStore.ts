import { create } from 'zustand';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import type { 
  RouteSummaryResponse, 
  ScheduleSummaryResponse, 
  ScheduleSeatResponse,
  CityOption,
  BookingSummaryResponse,
  BookingDetailResponse,
  PaymentResponse,
  OperatorResponse
} from '../types/booking';

interface BookingState {
  departureCity: CityOption | null;
  arrivalCity: CityOption | null;
  departureDate: string;
  scheduleStatusFilter: string;
  routes: RouteSummaryResponse[];
  schedules: ScheduleSummaryResponse[];
  cityOptions: CityOption[];
  isLoading: boolean;
  error: string | null;
  selectedSchedule: ScheduleSummaryResponse | null;
  selectedSeats: ScheduleSeatResponse[];
  myBookings: BookingSummaryResponse[];
  myBookingsPage: { totalElements: number; totalPages: number; currentPage: number };
  myBookingsFilter: { operatorId?: string; departureTime?: string; arrivalTime?: string };
  activeBookingDetail: BookingDetailResponse | null;
  myPayments: PaymentResponse[];
  myPaymentsPage: { totalElements: number; totalPages: number; currentPage: number };
  operators: OperatorResponse[];
  
  // Actions
  setDepartureCity: (city: CityOption | null) => void;
  setArrivalCity: (city: CityOption | null) => void;
  setDepartureDate: (date: string) => void;
  setScheduleStatusFilter: (status: string) => void;
  setMyBookingsFilter: (filter: { operatorId?: string; departureTime?: string; arrivalTime?: string }) => void;
  fetchRoutes: () => Promise<void>;
  fetchSchedules: () => Promise<void>;
  loadCities: () => Promise<void>;
  loadOperators: () => Promise<void>;
  setSelectedSchedule: (schedule: ScheduleSummaryResponse | null) => void;
  toggleSeatSelection: (seat: ScheduleSeatResponse) => void;
  clearSeatSelection: () => void;
  fetchMyBookings: (page: number, size: number) => Promise<void>;
  fetchBookingDetail: (id: number) => Promise<void>;
  cancelBooking: (id: number) => Promise<void>;
  fetchMyPayments: (page: number, size: number) => Promise<void>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  departureCity: null,
  arrivalCity: null,
  departureDate: '2026-07-25',
  scheduleStatusFilter: 'OPEN',
  routes: [],
  schedules: [],
  cityOptions: [],
  isLoading: false,
  error: null,
  selectedSchedule: null,
  selectedSeats: [],
  myBookings: [],
  myBookingsPage: { totalElements: 0, totalPages: 0, currentPage: 0 },
  myBookingsFilter: {},
  activeBookingDetail: null,
  myPayments: [],
  myPaymentsPage: { totalElements: 0, totalPages: 0, currentPage: 0 },
  operators: [],

  setDepartureCity: (city) => set({ departureCity: city }),
  setArrivalCity: (city) => set({ arrivalCity: city }),
  setDepartureDate: (date) => set({ departureDate: date }),
  setScheduleStatusFilter: (status) => set({ scheduleStatusFilter: status }),
  setMyBookingsFilter: (filter) => set({ myBookingsFilter: filter }),

  loadCities: async () => {
    try {
      set({ isLoading: true, error: null });
      const cities = await bookingService.getCities();
      set({ cityOptions: cities, isLoading: false });
    } catch (err) {
      console.warn("Failed to load cities from API:", err);
      set({ cityOptions: [], isLoading: false });
    }
  },

  loadOperators: async () => {
    try {
      const ops = await bookingService.getOperators();
      set({ operators: ops });
    } catch (err) {
      console.warn("Failed to load operators from API:", err);
      set({ operators: [] });
    }
  },

  fetchRoutes: async () => {
    try {
      set({ isLoading: true, error: null });
      const depId = get().departureCity?.id;
      const arrId = get().arrivalCity?.id;
      const response = await bookingService.findRoutes({
        departureCityId: depId,
        arrivalCityId: arrId,
        page: 0,
        size: 50
      });
      set({ routes: response.content, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Có lỗi xảy ra khi tải tuyến xe', isLoading: false });
    }
  },

  fetchSchedules: async () => {
    try {
      set({ isLoading: true, error: null, schedules: [], selectedSchedule: null, selectedSeats: [] });
      const depId = get().departureCity?.id;
      const arrId = get().arrivalCity?.id;
      const date = get().departureDate;
      const status = get().scheduleStatusFilter;
      
      // format: yyyy-MM-ddT00:00:00
      const formattedDate = date ? `${date}T00:00:00` : undefined;

      const response = await bookingService.findSchedules({
        departureCityId: depId,
        arrivalCityId: arrId,
        departureTime: formattedDate,
        status: status && status !== 'ALL' ? status : undefined,
        page: 0,
        size: 50
      });
      set({ schedules: response.content, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Có lỗi xảy ra khi tải lịch trình', isLoading: false });
    }
  },

  setSelectedSchedule: (schedule) => set({ selectedSchedule: schedule, selectedSeats: [] }),

  toggleSeatSelection: (seat) => {
    const selected = get().selectedSeats;
    const isAlreadySelected = selected.some(s => s.id === seat.id);
    
    if (isAlreadySelected) {
      set({ selectedSeats: selected.filter(s => s.id !== seat.id) });
    } else {
      if (selected.length >= 5) {
        alert("Bạn chỉ được chọn tối đa 5 ghế cho mỗi giao dịch.");
        return;
      }
      set({ selectedSeats: [...selected, seat] });
    }
  },

  clearSeatSelection: () => set({ selectedSeats: [] }),

  fetchMyBookings: async (page: number, size: number) => {
    try {
      set({ isLoading: true, error: null });
      const filter = get().myBookingsFilter || {};
      const response = await bookingService.getMyBookings({ 
        page, 
        size,
        ...filter
      });
      set({ 
        myBookings: response.content, 
        myBookingsPage: { 
          totalElements: response.totalElements, 
          totalPages: response.totalPages, 
          currentPage: response.page !== undefined ? response.page : response.number 
        }, 
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message || 'Có lỗi xảy ra khi tải danh sách đặt vé', isLoading: false });
    }
  },

  fetchBookingDetail: async (id: number) => {
    try {
      set({ isLoading: true, error: null, activeBookingDetail: null });
      const detail = await bookingService.getBookingDetail(id);
      set({ activeBookingDetail: detail, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Có lỗi xảy ra khi tải chi tiết đặt vé', isLoading: false });
    }
  },

  cancelBooking: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await bookingService.cancelBooking(id);
      // Refresh the myBookings list
      const currentPage = get().myBookingsPage.currentPage;
      const filter = get().myBookingsFilter || {};
      const response = await bookingService.getMyBookings({ 
        page: currentPage, 
        size: 10,
        ...filter
      });
      set({ 
        myBookings: response.content, 
        myBookingsPage: { 
          totalElements: response.totalElements, 
          totalPages: response.totalPages, 
          currentPage: response.page !== undefined ? response.page : response.number 
        }, 
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message || 'Có lỗi xảy ra khi hủy đặt vé', isLoading: false });
      throw err;
    }
  },

  fetchMyPayments: async (page: number, size: number) => {
    try {
      set({ isLoading: true, error: null });
      const response = await paymentService.getMyPayments({ page, size });
      set({ 
        myPayments: response.content, 
        myPaymentsPage: { 
          totalElements: response.totalElements, 
          totalPages: response.totalPages, 
          currentPage: response.number 
        }, 
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message || 'Có lỗi xảy ra khi tải lịch sử giao dịch', isLoading: false });
    }
  }
}));

