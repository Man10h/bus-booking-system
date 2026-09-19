import apiClient from './apiClient';
import type { ApiResponse } from '../types/api';
import type { 
  UserPageResponse, 
  UserFilterParams,
  ServiceClientResponse, 
  ServiceClientRequest,
  VehicleTypeResponse,
  VehicleTypeRequest,
  VehicleTypePageResponse,
  VehicleTypeFilterParams
} from '../types/admin';

export const adminService = {
  // Quản lý người dùng
  getUsers: async (
    page: number = 0, 
    size: number = 10, 
    filters: UserFilterParams = {}
  ): Promise<UserPageResponse> => {
    const params: Record<string, any> = { page, size };
    if (filters.keyword && filters.keyword.trim() !== '') {
      params.keyword = filters.keyword.trim();
    }
    if (filters.roleId !== undefined && filters.roleId !== null) {
      params.roleId = filters.roleId;
    }
    if (filters.roleName && filters.roleName.trim() !== '') {
      params.roleName = filters.roleName.trim();
    }
    if (filters.enabled !== undefined && filters.enabled !== '') {
      params.enabled = filters.enabled;
    }
    if (filters.gender && filters.gender.trim() !== '') {
      params.gender = filters.gender.trim();
    }
    if (filters.sortBy) {
      const dir = filters.sortDir || 'desc';
      params.sort = `${filters.sortBy},${dir}`;
    }

    const res = await apiClient.get<ApiResponse<UserPageResponse>>('/users', { params });
    return res.data.data;
  },

  toggleUserLock: async (userId: string, currentlyEnabled: boolean): Promise<void> => {
    const endpoint = currentlyEnabled ? `/users/${userId}/lock` : `/users/${userId}/unlock`;
    await apiClient.patch<ApiResponse<null>>(endpoint);
  },

  promoteToOperator: async (userId: string): Promise<void> => {
    await apiClient.patch<ApiResponse<null>>(`/users/${userId}/promote-operator`);
  },

  // Quản lý Service Client
  getServiceClients: async (): Promise<ServiceClientResponse[]> => {
    const res = await apiClient.get<ApiResponse<ServiceClientResponse[]>>('/auth/service-client');
    return res.data.data;
  },

  createServiceClient: async (request: ServiceClientRequest): Promise<ServiceClientResponse> => {
    const res = await apiClient.post<ApiResponse<ServiceClientResponse>>('/auth/service-client', request);
    return res.data.data;
  },

  updateServiceClient: async (id: number, request: ServiceClientRequest): Promise<ServiceClientResponse> => {
    const res = await apiClient.put<ApiResponse<ServiceClientResponse>>(`/auth/service-client/${id}`, request);
    return res.data.data;
  },

  // Quản lý loại xe (Vehicle Type)
  getVehicleTypes: async (
    page: number = 0, 
    size: number = 10, 
    filters: VehicleTypeFilterParams = {}
  ): Promise<VehicleTypePageResponse> => {
    const params: Record<string, any> = { page, size };
    if (filters.keyword && filters.keyword.trim() !== '') {
      params.keyword = filters.keyword.trim();
    }
    if (filters.seatType && filters.seatType.trim() !== '') {
      params.seatType = filters.seatType.trim();
    }
    if (filters.floors !== undefined && filters.floors !== '') {
      params.floors = filters.floors;
    }
    if (filters.sortBy) {
      const dir = filters.sortDir || 'asc';
      params.sort = `${filters.sortBy},${dir}`;
    }

    const res = await apiClient.get<ApiResponse<VehicleTypePageResponse>>('/core/vehicleTypes', { params });
    return res.data.data;
  },

  getAllVehicleTypes: async (): Promise<VehicleTypeResponse[]> => {
    const res = await apiClient.get<ApiResponse<VehicleTypeResponse[]>>('/core/vehicleTypes/all');
    return res.data.data;
  },

  createVehicleType: async (request: VehicleTypeRequest): Promise<VehicleTypeResponse> => {
    const res = await apiClient.post<ApiResponse<VehicleTypeResponse>>('/core/vehicleTypes', request);
    return res.data.data;
  },

  updateVehicleType: async (id: number, request: VehicleTypeRequest): Promise<void> => {
    await apiClient.put<ApiResponse<null>>(`/core/vehicleTypes/${id}`, request);
  },

  deleteVehicleType: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/core/vehicleTypes/${id}`);
  }
};
