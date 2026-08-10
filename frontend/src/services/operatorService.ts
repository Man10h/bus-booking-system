import apiClient from './apiClient';
import type { ApiResponse } from '../types/api';
import type { 
  OperatorResponse, 
  MerchantResponse, 
  VehicleResponse, 
  VehicleTypeResponse,
  StatisticOverviewResponse,
  RevenueChartData,
  TopRouteResponse,
  TopVehicleResponse
} from '../types/operator';
import type { 
  RouteDetailResponse, 
  RoutePageResponse, 
  SeatResponse, 
  SchedulePageResponse,
  ScheduleSummaryResponse
} from '../types/booking';

export const operatorService = {
  // 1. Operator Profile & Merchant Config
  getMyProfile: async (): Promise<OperatorResponse> => {
    const res = await apiClient.get<ApiResponse<OperatorResponse>>('/core/operators/me');
    return res.data.data;
  },

  createProfile: async (data: {
    companyName: string;
    taxCode: string;
    contactPhone: string;
  }): Promise<OperatorResponse> => {
    const res = await apiClient.post<ApiResponse<OperatorResponse>>('/core/operators', data);
    return res.data.data;
  },

  updateProfile: async (data: {
    companyName: string;
    taxCode: string;
    contactPhone: string;
    avatarUrl?: string;
  }): Promise<OperatorResponse> => {
    const res = await apiClient.put<ApiResponse<OperatorResponse>>('/core/operators', data);
    return res.data.data;
  },

  getMerchant: async (merchantId: string): Promise<MerchantResponse> => {
    const res = await apiClient.get<ApiResponse<MerchantResponse>>(`/payments/merchants/${merchantId}`);
    return res.data.data;
  },

  getMerchants: async (params: { page: number; size: number }): Promise<{
    content: MerchantResponse[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  }> => {
    const res = await apiClient.get<ApiResponse<{
      content: MerchantResponse[];
      totalElements: number;
      totalPages: number;
      page?: number;
      number: number;
      size: number;
    }>>('/payments/merchants', { params });
    const data = res.data.data;
    return {
      ...data,
      page: data.page !== undefined ? data.page : data.number
    };
  },

  getPaymentProviders: async (): Promise<string[]> => {
    const res = await apiClient.get<ApiResponse<string[]>>('/payments/providers');
    return res.data.data;
  },

  createMerchant: async (data: {
    provider: string;
    merchantCode: string;
    secretKey: string;
  }): Promise<MerchantResponse> => {
    const res = await apiClient.post<ApiResponse<MerchantResponse>>('/payments/merchants', data);
    return res.data.data;
  },

  updateMerchant: async (
    id: string,
    data: {
      merchantCode: string;
      secretKey: string;
      active: boolean;
    }
  ): Promise<MerchantResponse> => {
    const res = await apiClient.put<ApiResponse<MerchantResponse>>(`/payments/merchants/${id}`, data);
    return res.data.data;
  },

  // 2. Routes Management
  getMyRoutes: async (params: { page: number; size: number; operatorId?: string }): Promise<RoutePageResponse> => {
    const res = await apiClient.get<ApiResponse<RoutePageResponse>>('/core/routes', { params });
    return res.data.data;
  },

  getRouteDetail: async (routeId: number): Promise<RouteDetailResponse> => {
    const res = await apiClient.get<ApiResponse<RouteDetailResponse>>(`/core/routes/${routeId}`);
    return res.data.data;
  },

  createRoute: async (data: {
    routeCode: string;
    departureCityId: number;
    arrivalCityId: number;
    distance: number;
    estimatedDurationMinutes: number;
    routeStops: {
      stopOrder: number;
      stopName: string;
      distanceFromStart: number;
      estimatedArrivalOffsetMinutes: number;
      isPickup: boolean;
      isDropOff: boolean;
      cityId: number;
    }[];
  }): Promise<RouteDetailResponse> => {
    const res = await apiClient.post<ApiResponse<RouteDetailResponse>>('/core/routes', data);
    return res.data.data;
  },

  updateRoute: async (routeId: number, data: {
    routeCode: string;
    departureCityId: number;
    arrivalCityId: number;
    distance: number;
    estimatedDurationMinutes: number;
    routeStops: {
      stopOrder: number;
      stopName: string;
      distanceFromStart: number;
      estimatedArrivalOffsetMinutes: number;
      isPickup: boolean;
      isDropOff: boolean;
      cityId: number;
    }[];
  }): Promise<RouteDetailResponse> => {
    const res = await apiClient.put<ApiResponse<RouteDetailResponse>>(`/core/routes/${routeId}`, data);
    return res.data.data;
  },

  deactivateRoute: async (routeId: number): Promise<void> => {
    await apiClient.patch<ApiResponse<null>>(`/core/routes/${routeId}/inactive`);
  },

  activateRoute: async (routeId: number): Promise<void> => {
    await apiClient.patch<ApiResponse<null>>(`/core/routes/${routeId}/active`);
  },

  // 3. Vehicles & Seats Management
  getMyVehicles: async (params: { page: number; size: number }): Promise<{
    content: VehicleResponse[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  }> => {
    const res = await apiClient.get<ApiResponse<{
      content: VehicleResponse[];
      totalElements: number;
      totalPages: number;
      page?: number;
      number: number;
      size: number;
    }>>('/core/vehicles', { params });
    const data = res.data.data;
    return {
      ...data,
      page: data.page !== undefined ? data.page : data.number
    };
  },

  getVehicleDetail: async (vehicleId: number): Promise<VehicleResponse> => {
    const res = await apiClient.get<ApiResponse<VehicleResponse>>(`/core/vehicles/${vehicleId}`);
    return res.data.data;
  },

  createVehicle: async (data: {
    licensePlate: string;
    brand: string;
    model: string;
    totalSeats: number;
    description: string;
    vehicleTypeId: number;
  }): Promise<VehicleResponse> => {
    const res = await apiClient.post<ApiResponse<VehicleResponse>>('/core/vehicles', data);
    return res.data.data;
  },

  updateVehicle: async (vehicleId: number, data: {
    licensePlate: string;
    brand: string;
    model: string;
    totalSeats: number;
    description: string;
    vehicleTypeId: number;
  }): Promise<void> => {
    await apiClient.put<ApiResponse<null>>(`/core/vehicles/${vehicleId}`, data);
  },

  updateVehicleStatus: async (vehicleId: number, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => {
    await apiClient.patch<ApiResponse<null>>(`/core/vehicles/${vehicleId}/status`, status, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  },

  getVehicleSeats: async (vehicleId: number): Promise<SeatResponse[]> => {
    const res = await apiClient.get<ApiResponse<SeatResponse[]>>(`/core/vehicles/${vehicleId}/seats`);
    return res.data.data;
  },

  updateSeatStatus: async (seatId: number, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => {
    await apiClient.patch<ApiResponse<null>>(`/core/seats/${seatId}/status`, { status });
  },

  toggleSeatVip: async (seatId: number): Promise<void> => {
    await apiClient.patch<ApiResponse<null>>(`/core/seats/${seatId}/isVip`);
  },

  getVehicleTypes: async (): Promise<VehicleTypeResponse[]> => {
    const res = await apiClient.get<ApiResponse<VehicleTypeResponse[]>>('/core/vehicleTypes');
    return res.data.data;
  },

  // 4. Schedules Management
  getMySchedules: async (params: { page: number; size: number; operatorId?: string }): Promise<SchedulePageResponse> => {
    const res = await apiClient.get<ApiResponse<SchedulePageResponse>>('/core/schedules', { params });
    return res.data.data;
  },

  createSchedule: async (data: {
    routeId: number;
    vehicleId: number;
    departureTime: string; // ISO yyyy-MM-ddT00:00:00
    arrivalTime: string;   // ISO yyyy-MM-ddT00:00:00
    basePrice: number;
    vipPrice: number;
  }): Promise<ScheduleSummaryResponse> => {
    const res = await apiClient.post<ApiResponse<ScheduleSummaryResponse>>('/core/schedules', data);
    return res.data.data;
  },

  updateSchedule: async (scheduleId: number, data: {
    routeId: number;
    vehicleId: number;
    departureTime: string;
    arrivalTime: string;
    basePrice: number;
    vipPrice: number;
  }): Promise<void> => {
    await apiClient.put<ApiResponse<null>>(`/core/schedules/${scheduleId}`, data);
  },

  cancelSchedule: async (scheduleId: number): Promise<void> => {
    await apiClient.patch<ApiResponse<null>>(`/core/schedules/${scheduleId}/cancel`);
  },

  // 5. Statistics API
  getStatisticOverview: async (): Promise<StatisticOverviewResponse> => {
    const res = await apiClient.get<ApiResponse<StatisticOverviewResponse>>('/core/statistic/overview');
    return res.data.data;
  },

  getRevenueChart: async (params: {
    from: string;
    to: string;
    statisticType: 'DAY' | 'MONTH';
  }): Promise<RevenueChartData[]> => {
    const res = await apiClient.get<ApiResponse<RevenueChartData[]>>('/core/statistic/revenue', { params });
    return res.data.data;
  },

  getTopRoutes: async (): Promise<TopRouteResponse[]> => {
    const res = await apiClient.get<ApiResponse<TopRouteResponse[]>>('/core/statistic/routes/top');
    return res.data.data;
  },

  getTopVehicles: async (): Promise<TopVehicleResponse[]> => {
    const res = await apiClient.get<ApiResponse<TopVehicleResponse[]>>('/core/statistic/vehicles/top');
    return res.data.data;
  }
};
