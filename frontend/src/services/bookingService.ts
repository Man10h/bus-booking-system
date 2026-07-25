import apiClient from './apiClient';
import type { ApiResponse } from '../types/api';
import type { 
  RoutePageResponse, 
  RouteDetailResponse, 
  SchedulePageResponse, 
  ScheduleSeatResponse,
  CityOption,
  BookingSummaryResponse,
  BookingDetailResponse,
  BookingPageResponse,
  OperatorResponse
} from '../types/booking';

export const bookingService = {
  getOperators: async (): Promise<OperatorResponse[]> => {
    const res = await apiClient.get<ApiResponse<OperatorResponse[]>>('/core/operators');
    return res.data.data;
  },
  findRoutes: async (params: {
    departureCityId?: number;
    arrivalCityId?: number;
    page?: number;
    size?: number;
  }): Promise<RoutePageResponse> => {
    const res = await apiClient.get<ApiResponse<RoutePageResponse>>('/core/routes', { params });
    return res.data.data;
  },

  getRouteDetail: async (routeId: number): Promise<RouteDetailResponse> => {
    const res = await apiClient.get<ApiResponse<RouteDetailResponse>>(`/core/routes/${routeId}`);
    return res.data.data;
  },

  findSchedules: async (params: {
    departureCityId?: number;
    arrivalCityId?: number;
    departureTime?: string; // ISO 8601 string or date
    page?: number;
    size?: number;
  }): Promise<SchedulePageResponse> => {
    const res = await apiClient.get<ApiResponse<SchedulePageResponse>>('/core/schedules', { params });
    return res.data.data;
  },

  getScheduleSeats: async (scheduleId: number): Promise<ScheduleSeatResponse[]> => {
    const res = await apiClient.get<ApiResponse<ScheduleSeatResponse[]>>(`/core/schedules/${scheduleId}/seats`);
    return res.data.data;
  },

  getCities: async (): Promise<CityOption[]> => {
    const res = await apiClient.get<ApiResponse<CityOption[]>>('/core/cities');
    return res.data.data;
  },

  createBooking: async (scheduleId: number, scheduleSeatIds: number[]): Promise<BookingSummaryResponse> => {
    const res = await apiClient.post<ApiResponse<BookingSummaryResponse>>('/core/bookings', {
      scheduleId,
      scheduleSeatIds
    });
    return res.data.data;
  },

  getMyBookings: async (params: { 
    page: number; 
    size: number; 
    operatorId?: string; 
    departureTime?: string; 
    arrivalTime?: string; 
  }): Promise<BookingPageResponse> => {
    const res = await apiClient.get<ApiResponse<BookingPageResponse>>('/core/bookings/me', { params });
    return res.data.data;
  },

  getBookingDetail: async (id: number): Promise<BookingDetailResponse> => {
    const res = await apiClient.get<ApiResponse<BookingDetailResponse>>(`/core/bookings/me/${id}`);
    return res.data.data;
  },

  cancelBooking: async (bookingId: number): Promise<void> => {
    await apiClient.patch<ApiResponse<null>>(`/core/bookings/${bookingId}/cancel`);
  }
};

