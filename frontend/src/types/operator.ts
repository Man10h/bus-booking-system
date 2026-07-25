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
