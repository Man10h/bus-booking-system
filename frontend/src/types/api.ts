export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface UserResponse {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  address: string | null;
  gender: string | null;
  avatarUrl: string | null;
  enabled: boolean;
  createdAt: string;
  role: 'USER' | 'OPERATOR' | 'ADMIN';
}
