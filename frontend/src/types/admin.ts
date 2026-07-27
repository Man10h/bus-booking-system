import type { UserResponse } from './api';

export interface UserPageResponse {
  content: UserResponse[];
  totalElements: number;
  totalPages: number;
  page?: number;
  number: number;
  size: number;
}

export interface ServiceClientResponse {
  id: number;
  clientId: string;
  clientSecret: string;
  scope: string;
  active: boolean;
}

export interface ServiceClientRequest {
  clientId: string;
  clientSecret: string;
  scope: string;
}

export interface VehicleTypeResponse {
  id: number;
  seatType: string;
  code: string;
  name: string;
  floors: number;
  rows: number;
  cols: number;
}

export interface VehicleTypeRequest {
  seatType: string;
  code: string;
  name: string;
  floors: number;
  rows: number;
  cols: number;
}
