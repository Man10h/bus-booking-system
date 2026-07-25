import apiClient from './apiClient';
import type { ApiResponse } from '../types/api';
import type { PaymentPageResponse } from '../types/booking';

export const paymentService = {
  createPaymentLink: async (bookingId: number): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>>('/payments', {
      provider: 'VNPAY',
      bookingId
    });
    return res.data.data; // Trả về URL cổng thanh toán VNPay Sandbox
  },

  getMyPayments: async (params: { page: number; size: number }): Promise<PaymentPageResponse> => {
    const res = await apiClient.get<ApiResponse<PaymentPageResponse>>('/payments/me', { params });
    return res.data.data;
  }
};
