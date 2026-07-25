import { create } from 'zustand';
import { notificationService } from '../services/notificationService';
import type { NotificationItem } from '../types/notification';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (page?: number, size?: number, append?: boolean) => Promise<void>;
  markNotificationAsRead: (id: number) => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (page = 0, size = 10, append = false) => {
    set({ isLoading: true, error: null });
    try {
      const data = await notificationService.getMyNotifications(page, size);
      
      const newNotifications = append 
        ? [...get().notifications, ...data.content] 
        : data.content;

      // Vì backend GET /notifications chỉ trả về các thông báo chưa đọc (isRead = false),
      // nên số lượng chưa đọc chính là tổng số phần tử (totalElements).
      // Tuy nhiên, để đảm bảo khớp trạng thái local khi người dùng click mark read,
      // ta tính unreadCount dựa trên data.totalElements trừ đi số lượng thông báo đã được đánh dấu là đọc ở local.
      const localReadCount = newNotifications.filter(item => item.isRead).length;
      const unreadCount = Math.max(0, data.totalElements - localReadCount);

      set({
        notifications: newNotifications,
        unreadCount,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        currentPage: data.page,
        isLoading: false
      });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || err.message || 'Lỗi tải danh sách thông báo', 
        isLoading: false 
      });
    }
  },

  markNotificationAsRead: async (id: number) => {
    try {
      // Gọi API cập nhật trạng thái ở DB
      await notificationService.markAsRead(id);
      
      // Cập nhật local state
      const updatedNotifications = get().notifications.map(item => 
        item.id === id ? { ...item, isRead: true } : item
      );
      
      // Tính lại unreadCount dựa trên các item chưa đọc còn lại
      const unreadCount = Math.max(0, get().unreadCount - 1);

      set({
        notifications: updatedNotifications,
        unreadCount
      });
    } catch (err) {
      console.error('Không thể đánh dấu đã đọc thông báo', err);
    }
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      isLoading: false,
      error: null
    });
  }
}));
