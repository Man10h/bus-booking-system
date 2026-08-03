import { create } from 'zustand';
import { operatorService } from '../services/operatorService';
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
  RouteSummaryResponse,
  SeatResponse, 
  ScheduleSummaryResponse
} from '../types/booking';

interface OperatorState {
  profile: OperatorResponse | null;
  merchants: MerchantResponse[];
  merchantsPage: { totalElements: number; totalPages: number; currentPage: number };
  providers: string[];
  routes: RouteSummaryResponse[];
  routesPage: { totalElements: number; totalPages: number; currentPage: number };
  vehicles: VehicleResponse[];
  vehiclesPage: { totalElements: number; totalPages: number; currentPage: number };
  schedules: ScheduleSummaryResponse[];
  schedulesPage: { totalElements: number; totalPages: number; currentPage: number };
  vehicleTypes: VehicleTypeResponse[];
  activeSeats: SeatResponse[];
  statisticOverview: StatisticOverviewResponse | null;
  revenueChartData: RevenueChartData[];
  topRoutes: TopRouteResponse[];
  topVehicles: TopVehicleResponse[];
  isStatsLoading: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<OperatorResponse | null>;
  createProfile: (data: { companyName: string; taxCode: string; contactPhone: string }) => Promise<void>;
  updateProfile: (data: { companyName: string; taxCode: string; contactPhone: string; avatarUrl?: string }) => Promise<void>;
  fetchProviders: () => Promise<void>;
  fetchMerchants: (page: number, size: number) => Promise<void>;
  setupMerchant: (provider: string, data: { merchantCode: string; secretKey: string }) => Promise<void>;
  updateMerchant: (id: string, data: { merchantCode: string; secretKey: string; active: boolean }) => Promise<void>;
  deleteMerchant: (id: string) => Promise<void>;

  fetchRoutes: (page: number, size: number) => Promise<void>;
  createRoute: (data: any) => Promise<void>;
  updateRoute: (routeId: number, data: any) => Promise<void>;
  deactivateRoute: (routeId: number) => Promise<void>;
  activateRoute: (routeId: number) => Promise<void>;

  fetchVehicles: (page: number, size: number) => Promise<void>;
  fetchVehicleTypes: () => Promise<void>;
  createVehicle: (data: any) => Promise<void>;
  updateVehicle: (vehicleId: number, data: any) => Promise<void>;
  updateVehicleStatus: (vehicleId: number, status: 'ACTIVE' | 'INACTIVE') => Promise<void>;
  fetchVehicleSeats: (vehicleId: number) => Promise<void>;
  updateSeatStatus: (seatId: number, status: 'ACTIVE' | 'INACTIVE') => Promise<void>;
  toggleSeatVip: (seatId: number) => Promise<void>;

  fetchSchedules: (page: number, size: number) => Promise<void>;
  createSchedule: (data: any) => Promise<void>;
  updateSchedule: (scheduleId: number, data: any) => Promise<void>;
  cancelSchedule: (scheduleId: number) => Promise<void>;

  fetchStatsOverview: () => Promise<void>;
  fetchRevenueChart: (from: string, to: string, type: 'DAY' | 'MONTH') => Promise<void>;
  fetchTopRoutes: () => Promise<void>;
  fetchTopVehicles: () => Promise<void>;
}

export const useOperatorStore = create<OperatorState>((set, get) => ({
  profile: null,
  merchants: [],
  merchantsPage: { totalElements: 0, totalPages: 0, currentPage: 0 },
  providers: [],
  routes: [],
  routesPage: { totalElements: 0, totalPages: 0, currentPage: 0 },
  vehicles: [],
  vehiclesPage: { totalElements: 0, totalPages: 0, currentPage: 0 },
  schedules: [],
  schedulesPage: { totalElements: 0, totalPages: 0, currentPage: 0 },
  vehicleTypes: [],
  activeSeats: [],
  statisticOverview: null,
  revenueChartData: [],
  topRoutes: [],
  topVehicles: [],
  isStatsLoading: false,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const p = await operatorService.getMyProfile();
      set({ profile: p, isLoading: false });
      if (p) {
        await get().fetchMerchants(0, 5);
      }
      return p;
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải hồ sơ nhà xe', isLoading: false });
      return null;
    }
  },

  createProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const created = await operatorService.createProfile(data);
      set({ profile: created, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tạo hồ sơ nhà xe', isLoading: false });
      throw err;
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await operatorService.updateProfile(data);
      set((state) => ({
        profile: updated ? updated : (state.profile ? { ...state.profile, ...data } : null),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message || 'Lỗi cập nhật hồ sơ nhà xe', isLoading: false });
      throw err;
    }
  },

  fetchProviders: async () => {
    try {
      set({ isLoading: true, error: null });
      const provs = await operatorService.getPaymentProviders();
      set({ providers: provs, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải danh sách cổng thanh toán', isLoading: false });
    }
  },

  fetchMerchants: async (page, size) => {
    try {
      set({ isLoading: true, error: null });
      const res = await operatorService.getMerchants({ page, size });
      set({
        merchants: res.content,
        merchantsPage: {
          totalElements: res.totalElements,
          totalPages: res.totalPages,
          currentPage: res.page
        },
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải danh sách ví Merchant', isLoading: false });
    }
  },

  setupMerchant: async (provider, data) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.createMerchant({
        provider,
        merchantCode: data.merchantCode,
        secretKey: data.secretKey
      });
      await get().fetchMerchants(0, 5);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi thiết lập cổng thanh toán', isLoading: false });
      throw err;
    }
  },

  updateMerchant: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.updateMerchant(id, {
        merchantCode: data.merchantCode,
        secretKey: data.secretKey,
        active: data.active
      });
      await get().fetchMerchants(get().merchantsPage.currentPage, 5);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi cập nhật cổng thanh toán', isLoading: false });
      throw err;
    }
  },

  deleteMerchant: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const target = get().merchants.find(m => m.id === id);
      if (target) {
        await operatorService.updateMerchant(id, {
          merchantCode: target.merchantCode,
          secretKey: target.secretKey,
          active: false
        });
      }
      await get().fetchMerchants(get().merchantsPage.currentPage, 5);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi xóa cấu hình cổng thanh toán', isLoading: false });
      throw err;
    }
  },

  fetchRoutes: async (page, size) => {
    try {
      set({ isLoading: true, error: null });
      const res = await operatorService.getMyRoutes({ page, size });
      set({ 
        routes: res.content,
        routesPage: {
          totalElements: res.totalElements,
          totalPages: res.totalPages,
          currentPage: res.page
        },
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải danh sách tuyến chạy', isLoading: false });
    }
  },

  createRoute: async (data) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.createRoute(data);
      await get().fetchRoutes(0, 10);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tạo tuyến chạy', isLoading: false });
      throw err;
    }
  },

  updateRoute: async (routeId, data) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.updateRoute(routeId, data);
      await get().fetchRoutes(get().routesPage.currentPage, 10);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi cập nhật tuyến chạy', isLoading: false });
      throw err;
    }
  },

  deactivateRoute: async (routeId) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.deactivateRoute(routeId);
      await get().fetchRoutes(get().routesPage.currentPage, 10);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi hủy hoạt động tuyến chạy', isLoading: false });
      throw err;
    }
  },

  activateRoute: async (routeId) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.activateRoute(routeId);
      await get().fetchRoutes(get().routesPage.currentPage, 10);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi kích hoạt lại tuyến chạy', isLoading: false });
      throw err;
    }
  },

  fetchVehicles: async (page, size) => {
    try {
      set({ isLoading: true, error: null });
      const res = await operatorService.getMyVehicles({ page, size });
      set({
        vehicles: res.content,
        vehiclesPage: {
          totalElements: res.totalElements,
          totalPages: res.totalPages,
          currentPage: res.page
        },
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải danh sách xe', isLoading: false });
    }
  },

  fetchVehicleTypes: async () => {
    try {
      const types = await operatorService.getVehicleTypes();
      set({ vehicleTypes: types });
    } catch (err: any) {
      console.warn('Lỗi tải loại xe:', err);
    }
  },

  createVehicle: async (data) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.createVehicle(data);
      await get().fetchVehicles(0, 10);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tạo xe mới', isLoading: false });
      throw err;
    }
  },

  updateVehicle: async (vehicleId, data) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.updateVehicle(vehicleId, data);
      await get().fetchVehicles(get().vehiclesPage.currentPage, 10);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi cập nhật xe', isLoading: false });
      throw err;
    }
  },

  updateVehicleStatus: async (vehicleId, status) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.updateVehicleStatus(vehicleId, status);
      await get().fetchVehicles(get().vehiclesPage.currentPage, 10);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi cập nhật trạng thái xe', isLoading: false });
      throw err;
    }
  },

  fetchVehicleSeats: async (vehicleId) => {
    try {
      set({ isLoading: true, error: null, activeSeats: [] });
      const seats = await operatorService.getVehicleSeats(vehicleId);
      set({ activeSeats: seats, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải danh sách ghế ngồi của xe', isLoading: false });
    }
  },

  updateSeatStatus: async (seatId, status) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.updateSeatStatus(seatId, status);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi cập nhật trạng thái ghế', isLoading: false });
      throw err;
    }
  },

  toggleSeatVip: async (seatId) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.toggleSeatVip(seatId);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi đổi trạng thái VIP của ghế', isLoading: false });
      throw err;
    }
  },

  fetchSchedules: async (page, size) => {
    try {
      set({ isLoading: true, error: null });
      const res = await operatorService.getMySchedules({ page, size });
      set({
        schedules: res.content,
        schedulesPage: {
          totalElements: res.totalElements,
          totalPages: res.totalPages,
          currentPage: res.page
        },
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải danh sách lịch trình', isLoading: false });
    }
  },

  createSchedule: async (data) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.createSchedule(data);
      await get().fetchSchedules(0, 10);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tạo lịch trình', isLoading: false });
      throw err;
    }
  },

  updateSchedule: async (scheduleId, data) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.updateSchedule(scheduleId, data);
      await get().fetchSchedules(get().schedulesPage.currentPage, 10);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi cập nhật lịch trình', isLoading: false });
      throw err;
    }
  },

  cancelSchedule: async (scheduleId) => {
    try {
      set({ isLoading: true, error: null });
      await operatorService.cancelSchedule(scheduleId);
      await get().fetchSchedules(get().schedulesPage.currentPage, 10);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi hủy lịch trình', isLoading: false });
      throw err;
    }
  },

  fetchStatsOverview: async () => {
    try {
      set({ isStatsLoading: true, error: null });
      const data = await operatorService.getStatisticOverview();
      set({ statisticOverview: data, isStatsLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải thống kê tổng quan', isStatsLoading: false });
    }
  },

  fetchRevenueChart: async (from, to, type) => {
    try {
      set({ isStatsLoading: true, error: null });
      const data = await operatorService.getRevenueChart({ from, to, statisticType: type });
      set({ revenueChartData: data, isStatsLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải dữ liệu biểu đồ doanh thu', isStatsLoading: false });
    }
  },

  fetchTopRoutes: async () => {
    try {
      const data = await operatorService.getTopRoutes();
      set({ topRoutes: data });
    } catch (err: any) {
      console.warn('Lỗi tải top tuyến đường:', err);
    }
  },

  fetchTopVehicles: async () => {
    try {
      const data = await operatorService.getTopVehicles();
      set({ topVehicles: data });
    } catch (err: any) {
      console.warn('Lỗi tải top xe chạy:', err);
    }
  }
}));
