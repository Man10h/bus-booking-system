import type { VehicleResponse } from './operator';

export interface OperatorResponse {
  id: string;
  companyName: string;
  taxCode: string;
  contactPhone: string;
  avatarUrl: string;
}

export interface RouteStopResponse {
  id: number;
  stopOrder: number;
  stopName: string;
  distanceFromStart: number;
  estimatedArrivalOffsetMinutes: number;
  isPickup: boolean;
  isDropOff: boolean;
  cityName: string;
}

export interface RouteDetailResponse {
  id: number;
  routeCode: string;
  distance: number;
  estimatedDurationMinutes: number;
  status: string;
  operatorResponse: OperatorResponse;
  arrivalCityName: string;
  departureCityName: string;
  routeStopResponse: RouteStopResponse[];
}

export interface RouteSummaryResponse {
  id: number;
  routeCode: string;
  distance: number;
  estimatedDurationMinutes: number;
  status: string;
  operatorResponse: OperatorResponse;
  arrivalCityName: string;
  departureCityName: string;
}

export interface RoutePageResponse {
  content: RouteSummaryResponse[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface ScheduleSummaryResponse {
  id: number;
  operatorId: string;
  departureTime: string; // ISO LocalDateTime
  arrivalTime: string;   // ISO LocalDateTime
  basePrice: number;
  vipPrice: number;
  availableSeats: number;
  status: string;
  totalSeats: number;
  departureCityName?: string;
  arrivalCityName?: string;
  vehicleResponse?: VehicleResponse;
  routeDetailResponse?: RouteDetailResponse;
}

export interface SchedulePageResponse {
  content: ScheduleSummaryResponse[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface SeatResponse {
  id: number;
  seatNumber: string;
  floor: number;
  row: number;
  col: number;
  seatType: 'SLEEPER' | 'STANDARD';
  status: 'ACTIVE' | 'INACTIVE';
  isVip: boolean;
}

export interface ScheduleSeatResponse {
  id: number;
  price: number;
  heldBy: string | null;
  heldAt: string | null;
  expiresAt: string | null;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  seatResponse: SeatResponse;
}

export interface CityOption {
  id: number;
  name: string;
  code?: string;
}

export interface BookingSummaryResponse {
  id: number;
  userId: string;
  operatorId: string;
  bookingCode: string;
  totalAmount: number;
  paymentDeadline: string; // ISO LocalDateTime string
  createAt: string;        // ISO LocalDateTime string
  status: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'COMPLETED';
}

export interface BookingDetailResponse {
  id: number;
  userId: string;
  operatorId: string;
  bookingCode: string;
  totalAmount: number;
  paymentDeadline: string;
  createAt: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'COMPLETED';
  scheduleSummaryResponse: ScheduleSummaryResponse;
  scheduleSeatResponseList: ScheduleSeatResponse[];
}

export interface BookingPageResponse {
  content: BookingSummaryResponse[];
  totalElements: number;
  totalPages: number;
  page?: number;
  number: number;
  size: number;
}

export interface PaymentResponse {
  id: string;
  userId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  provider: 'VNPAY';
  transactionId: string;
  txnRef: string;
  createdAt: string;     // ISO LocalDateTime string
  paidAt: string | null; // ISO LocalDateTime string
  bookingId: number;
}

export interface PaymentPageResponse {
  content: PaymentResponse[];
  totalElements: number;
  totalPages: number;
  page?: number;
  number: number;
  size: number;
}

