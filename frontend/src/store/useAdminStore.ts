import { create } from 'zustand';
import { adminService } from '../services/adminService';
import type { UserResponse } from '../types/api';
import type { 
  ServiceClientResponse, 
  VehicleTypeResponse, 
  UserFilterParams,
  VehicleTypeFilterParams 
} from '../types/admin';

interface AdminState {
  users: UserResponse[];
  usersPage: { totalElements: number; totalPages: number; currentPage: number };
  userFilters: UserFilterParams;
  serviceClients: ServiceClientResponse[];
  vehicleTypes: VehicleTypeResponse[];
  vehicleTypesPage: { totalElements: number; totalPages: number; currentPage: number };
  vehicleTypeFilters: VehicleTypeFilterParams;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUsers: (page?: number, size?: number, filters?: UserFilterParams) => Promise<void>;
  setUserFilters: (filters: Partial<UserFilterParams>) => void;
  resetUserFilters: () => void;
  toggleUserLock: (userId: string) => Promise<void>;
  promoteToOperator: (userId: string) => Promise<void>;
  
  fetchServiceClients: () => Promise<void>;
  createServiceClient: (request: any) => Promise<void>;
  updateServiceClient: (id: number, request: any) => Promise<void>;
  
  fetchVehicleTypes: (page?: number, size?: number, filters?: VehicleTypeFilterParams) => Promise<void>;
  setVehicleTypeFilters: (filters: Partial<VehicleTypeFilterParams>) => void;
  resetVehicleTypeFilters: () => void;
  createVehicleType: (request: any) => Promise<void>;
  updateVehicleType: (id: number, request: any) => Promise<void>;
  deleteVehicleType: (id: number) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  usersPage: { totalElements: 0, totalPages: 0, currentPage: 0 },
  userFilters: { keyword: '', roleName: '', enabled: '', sortBy: 'createdAt', sortDir: 'desc' },
  serviceClients: [],
  vehicleTypes: [],
  vehicleTypesPage: { totalElements: 0, totalPages: 0, currentPage: 0 },
  vehicleTypeFilters: { keyword: '', seatType: '', floors: '', sortBy: 'id', sortDir: 'asc' },
  isLoading: false,
  error: null,

  setUserFilters: (newFilters) => {
    set({ userFilters: { ...get().userFilters, ...newFilters } });
  },

  resetUserFilters: () => {
    const defaultFilters: UserFilterParams = { keyword: '', roleName: '', enabled: '', sortBy: 'createdAt', sortDir: 'desc' };
    set({ userFilters: defaultFilters });
    get().fetchUsers(0, 10, defaultFilters);
  },

  fetchUsers: async (page = 0, size = 10, filters) => {
    set({ isLoading: true, error: null });
    try {
      const activeFilters = filters !== undefined ? filters : get().userFilters;
      const data = await adminService.getUsers(page, size, activeFilters);
      set({ 
        users: data.content, 
        usersPage: { 
          totalElements: data.totalElements, 
          totalPages: data.totalPages, 
          currentPage: data.number 
        }, 
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message || 'Lỗi lấy danh sách người dùng', isLoading: false });
    }
  },

  toggleUserLock: async (userId) => {
    try {
      const user = get().users.find(u => u.id === userId);
      if (!user) return;
      await adminService.toggleUserLock(userId, user.enabled);
      set({
        users: get().users.map(u => u.id === userId ? { ...u, enabled: !u.enabled } : u)
      });
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi thay đổi trạng thái khóa người dùng');
    }
  },

  promoteToOperator: async (userId) => {
    try {
      await adminService.promoteToOperator(userId);
      set({
        users: get().users.map(u => u.id === userId ? { ...u, role: 'OPERATOR' } : u)
      });
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi nâng cấp người dùng lên Nhà xe');
    }
  },

  fetchServiceClients: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await adminService.getServiceClients();
      set({ serviceClients: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message || 'Lỗi lấy danh sách Service Client', isLoading: false });
    }
  },

  createServiceClient: async (request) => {
    set({ isLoading: true, error: null });
    try {
      const newClient = await adminService.createServiceClient(request);
      set({ 
        serviceClients: [...get().serviceClients, newClient],
        isLoading: false
      });
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.message || err.message || 'Lỗi thêm mới Service Client');
    }
  },

  updateServiceClient: async (id, request) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await adminService.updateServiceClient(id, request);
      set({
        serviceClients: get().serviceClients.map(c => c.id === id ? updated : c),
        isLoading: false
      });
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.message || err.message || 'Lỗi cập nhật Service Client');
    }
  },

  setVehicleTypeFilters: (newFilters) => {
    set({ vehicleTypeFilters: { ...get().vehicleTypeFilters, ...newFilters } });
  },

  resetVehicleTypeFilters: () => {
    const defaultFilters: VehicleTypeFilterParams = { keyword: '', seatType: '', floors: '', sortBy: 'id', sortDir: 'asc' };
    set({ vehicleTypeFilters: defaultFilters });
    get().fetchVehicleTypes(0, 10, defaultFilters);
  },

  fetchVehicleTypes: async (page = 0, size = 10, filters) => {
    set({ isLoading: true, error: null });
    try {
      const activeFilters = filters !== undefined ? filters : get().vehicleTypeFilters;
      const data = await adminService.getVehicleTypes(page, size, activeFilters);
      set({ 
        vehicleTypes: data.content, 
        vehicleTypesPage: {
          totalElements: data.totalElements,
          totalPages: data.totalPages,
          currentPage: data.page
        },
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message || 'Lỗi lấy danh sách Loại xe', isLoading: false });
    }
  },

  createVehicleType: async (request) => {
    set({ isLoading: true, error: null });
    try {
      await adminService.createVehicleType(request);
      await get().fetchVehicleTypes(get().vehicleTypesPage.currentPage, 10);
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.message || err.message || 'Lỗi thêm mới Loại xe');
    }
  },

  updateVehicleType: async (id, request) => {
    set({ isLoading: true, error: null });
    try {
      await adminService.updateVehicleType(id, request);
      await get().fetchVehicleTypes(get().vehicleTypesPage.currentPage, 10);
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.message || err.message || 'Lỗi cập nhật Loại xe');
    }
  },

  deleteVehicleType: async (id) => {
    try {
      await adminService.deleteVehicleType(id);
      await get().fetchVehicleTypes(get().vehicleTypesPage.currentPage, 10);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi xóa Loại xe');
    }
  }
}));
