import { INotificationService } from '../api/notificationService';
import { mockStorage } from './mockStorage';
import { Notification, ApiResponse } from '../../types';

export class MockNotificationService implements INotificationService {
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    await mockStorage.delay(100);
    return { success: true, data: mockStorage.getNotifications() };
  }

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    await mockStorage.delay(50);
    const notifications = mockStorage.getNotifications();
    const notif = notifications.find((n) => n.id === id);
    if (!notif) throw new Error('Notification not found');

    notif.isRead = true;
    mockStorage.saveNotifications(notifications);
    return { success: true, data: notif };
  }

  async markAllAsRead(): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(100);
    const notifications = mockStorage.getNotifications();
    notifications.forEach((n) => (n.isRead = true));
    mockStorage.saveNotifications(notifications);
    return { success: true, data: { success: true } };
  }

  async deleteNotification(id: string): Promise<ApiResponse<{ success: boolean }>> {
    await mockStorage.delay(100);
    let notifications = mockStorage.getNotifications();
    notifications = notifications.filter((n) => n.id !== id);
    mockStorage.saveNotifications(notifications);
    return { success: true, data: { success: true } };
  }
}

export const mockNotificationService = new MockNotificationService();
