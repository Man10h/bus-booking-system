export interface NotificationItem {
  id: number;
  userId: string;
  content: string;
  isRead: boolean;
  createdAt: string; // ISO LocalDateTime format, e.g. "2026-07-23T21:19:00"
  targetCode: string;
}

export interface NotificationPageResponse {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
