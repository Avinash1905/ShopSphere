/**
 * ShopSphere Multi-Channel Notification Dispatcher
 * In-app notifications, transactional email templates, SMS alerts, and WebSocket push bus.
 */

export interface NotificationPayload {
  id: string;
  recipientId: string;
  channel: 'in_app' | 'email' | 'sms' | 'push';
  type: 'order_update' | 'security_alert' | 'promotional' | 'seller_kyc' | 'price_drop';
  title: string;
  body: string;
  actionUrl?: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export class NotificationDispatcher {
  private notifications: NotificationPayload[] = [];

  public dispatch(
    recipientId: string,
    type: NotificationPayload['type'],
    title: string,
    body: string,
    channel: NotificationPayload['channel'] = 'in_app',
    actionUrl?: string,
    metadata?: Record<string, unknown>
  ): NotificationPayload {
    const notification: NotificationPayload = {
      id: `NTF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      recipientId,
      channel,
      type,
      title,
      body,
      actionUrl,
      isRead: false,
      metadata,
      createdAt: new Date().toISOString()
    };

    this.notifications.unshift(notification);
    return notification;
  }

  public getUserNotifications(recipientId: string, unreadOnly = false): NotificationPayload[] {
    return this.notifications.filter(n => n.recipientId === recipientId && (!unreadOnly || !n.isRead));
  }

  public markAsRead(notificationId: string): boolean {
    const item = this.notifications.find(n => n.id === notificationId);
    if (item) {
      item.isRead = true;
      return true;
    }
    return false;
  }

  public markAllAsRead(recipientId: string): number {
    let count = 0;
    for (const n of this.notifications) {
      if (n.recipientId === recipientId && !n.isRead) {
        n.isRead = true;
        count++;
      }
    }
    return count;
  }
}
