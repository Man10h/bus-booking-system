import { create } from 'zustand';
import type { UserResponse, LoginResponse } from '../types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  currentUser: UserResponse | null;
  isAuthenticated: boolean;
  setAuth: (tokens: LoginResponse, user: UserResponse) => void;
  updateUser: (user: UserResponse) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  currentUser: null,
  isAuthenticated: false,

  setAuth: (tokens, user) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(user));
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      currentUser: user,
      isAuthenticated: true,
    });
  },

  updateUser: (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    set({ currentUser: user });
  },

  setAccessToken: (token) => {
    localStorage.setItem('accessToken', token);
    set({ accessToken: token });
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    set({
      accessToken: null,
      refreshToken: null,
      currentUser: null,
      isAuthenticated: false,
    });
  },

  restoreSession: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('currentUser');
    if (refreshToken && userStr) {
      try {
        const currentUser = JSON.parse(userStr) as UserResponse;
        set({
          accessToken,
          refreshToken,
          currentUser,
          isAuthenticated: true,
        });
      } catch (e) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
      }
    }
  },
}));
