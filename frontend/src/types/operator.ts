export type { SeatResponse, OperatorResponse } from './booking';

export interface MerchantResponse {
  id: string;
  operatorId: string;
  provider: 'VNPAY';
  merchantCode: string;
  secretKey: string;
  active: boolean;
  createAt: string;
}

export interface VehicleTypeResponse {
  id: number;
  code: string;
  name: string;
  floors: number;
  rows: number;
  cols: number;
}

export interface VehicleResponse {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  totalSeats: number;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  operatorId: string;
  vehicleType?: VehicleTypeResponse;
  vehicleTypeResponse?: VehicleTypeResponse;
}

export interface StatisticOverviewResponse {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  todayRevenue: number;
  monthRevenue: number;
  totalRevenue: number;
  activeRoute: number;
  activeVehicle: number;
  openSchedule: number;
  runningSchedule: number;
}

export interface RevenueChartData {
  label: string;
  revenue: number;
}

export interface TopRouteResponse {
  routeId: number;
  routeCode: string;
  revenue: number;
}

export interface TopVehicleResponse {
  vehicleId: number;
  licensePlate: string;
  revenue: number;
}

