import apiClient from './apiClient';
import { useAuthStore } from '../store/useAuthStore';
import type { ApiResponse, LoginResponse, UserResponse } from '../types/api';

export const authService = {
  login: async (request: any): Promise<UserResponse> => {
    // 1. Call login endpoint to get tokens
    const loginRes = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', request);
    const tokens = loginRes.data.data;

    // Temporarily set the access token in store so that user-service request will be authenticated
    useAuthStore.getState().setAccessToken(tokens.accessToken);

    try {
      // 2. Fetch authenticated user profile details
      const userRes = await apiClient.get<ApiResponse<UserResponse>>('/users/me');
      const user = userRes.data.data;

      // 3. Save both tokens and user to store
      useAuthStore.getState().setAuth(tokens, user);
      return user;
    } catch (error) {
      // If fetching user details fails, rollback auth state
      useAuthStore.getState().clearAuth();
      throw error;
    }
  },

  register: async (request: any): Promise<void> => {
    await apiClient.post<ApiResponse<null>>('/users/register', request);
  },

  verifyOtp: async (email: string, verificationCode: string): Promise<boolean> => {
    const res = await apiClient.get<ApiResponse<boolean>>('/users/verify', {
      params: { email, verificationCode },
    });
    return res.data.data;
  },

  resendOtp: async (email: string): Promise<void> => {
    await apiClient.get<ApiResponse<null>>('/users/resend', {
      params: { email },
    });
  },

  changePassword: async (request: any): Promise<void> => {
    await apiClient.post<ApiResponse<null>>('/users/change-password', request);
  },

  updateProfile: async (request: any): Promise<UserResponse> => {
    const res = await apiClient.put<ApiResponse<UserResponse>>('/users/me', request);
    const updatedUser = res.data.data;
    useAuthStore.getState().updateUser(updatedUser);
    return updatedUser;
  },

  logout: () => {
    useAuthStore.getState().clearAuth();
  },
};
