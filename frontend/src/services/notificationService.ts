import apiClient from './apiClient';
import type { ApiResponse } from '../types/api';
import type { NotificationPageResponse } from '../types/notification';

export const notificationService = {
  /**
   * Lấy danh sách thông báo của tôi (phân trang)
   * API: GET /notifications
   */
  getMyNotifications: async (page: number = 0, size: number = 10): Promise<NotificationPageResponse> => {
    const res = await apiClient.get<ApiResponse<NotificationPageResponse>>('/notifications', {
      params: { page, size }
    });
    return res.data.data;
  },

  /**
   * Đánh dấu thông báo đã đọc
   * API: PATCH /notifications/{notificationId}/mark
   */
  markAsRead: async (notificationId: number): Promise<void> => {
    await apiClient.patch<ApiResponse<null>>(`/notifications/${notificationId}/mark`);
  }
};
