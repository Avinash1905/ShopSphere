import { httpClient } from './httpClient';
import { Notification, ApiResponse } from '../../types';

export interface INotificationService {
  getNotifications(): Promise<ApiResponse<Notification[]>>;
  markAsRead(id: string): Promise<ApiResponse<Notification>>;
  markAllAsRead(): Promise<ApiResponse<{ success: boolean }>>;
  deleteNotification(id: string): Promise<ApiResponse<{ success: boolean }>>;
}

export class ApiNotificationService implements INotificationService {
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return httpClient.get<Notification[]>('/notifications');
  }

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    return httpClient.patch<Notification>(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.post<{ success: boolean }>('/notifications/mark-all-read');
  }

  async deleteNotification(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.delete<{ success: boolean }>(`/notifications/${id}`);
  }
}

export const apiNotificationService = new ApiNotificationService();
