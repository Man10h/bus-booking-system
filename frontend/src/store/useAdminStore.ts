import { create } from 'zustand';
import { adminService } from '../services/adminService';
import type { UserResponse } from '../types/api';
import type { ServiceClientResponse, VehicleTypeResponse } from '../types/admin';

interface AdminState {
  users: UserResponse[];
  usersPage: { totalElements: number; totalPages: number; currentPage: number };
  serviceClients: ServiceClientResponse[];
  vehicleTypes: VehicleTypeResponse[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUsers: (page: number, size: number) => Promise<void>;
  toggleUserLock: (userId: string) => Promise<void>;
  promoteToOperator: (userId: string) => Promise<void>;
  
  fetchServiceClients: () => Promise<void>;
  createServiceClient: (request: any) => Promise<void>;
  updateServiceClient: (id: number, request: any) => Promise<void>;
  
  fetchVehicleTypes: () => Promise<void>;
  createVehicleType: (request: any) => Promise<void>;
  updateVehicleType: (id: number, request: any) => Promise<void>;
  deleteVehicleType: (id: number) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  usersPage: { totalElements: 0, totalPages: 0, currentPage: 0 },
  serviceClients: [],
  vehicleTypes: [],
  isLoading: false,
  error: null,

  fetchUsers: async (page, size) => {
    set({ isLoading: true, error: null });
    try {
      const data = await adminService.getUsers(page, size);
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

  fetchVehicleTypes: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await adminService.getVehicleTypes();
      set({ vehicleTypes: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message || 'Lỗi lấy danh sách Loại xe', isLoading: false });
    }
  },

  createVehicleType: async (request) => {
    set({ isLoading: true, error: null });
    try {
      const newType = await adminService.createVehicleType(request);
      set({ 
        vehicleTypes: [...get().vehicleTypes, newType],
        isLoading: false
      });
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.message || err.message || 'Lỗi thêm mới Loại xe');
    }
  },

  updateVehicleType: async (id, request) => {
    set({ isLoading: true, error: null });
    try {
      await adminService.updateVehicleType(id, request);
      set({
        vehicleTypes: get().vehicleTypes.map(t => t.id === id ? { ...t, ...request } : t),
        isLoading: false
      });
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.message || err.message || 'Lỗi cập nhật Loại xe');
    }
  },

  deleteVehicleType: async (id) => {
    try {
      await adminService.deleteVehicleType(id);
      set({
        vehicleTypes: get().vehicleTypes.filter(t => t.id !== id)
      });
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi xóa Loại xe');
    }
  }
}));
