export type NotificationCategory = 'orders' | 'promotions' | 'security' | 'system' | 'seller';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface NotificationFilterParams {
  category?: NotificationCategory;
  isRead?: boolean;
}
