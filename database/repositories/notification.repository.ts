import { BaseRepository, FindOptions, PaginatedResult } from './base.repository.js';
import { NotificationEntity } from '../schema/notification.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class NotificationRepository extends BaseRepository<NotificationEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('notifications', db);
  }

  public async getUserNotifications(userId: string, options: FindOptions<NotificationEntity> = {}): Promise<PaginatedResult<NotificationEntity>> {
    return this.findAll({
      ...options,
      where: { user_id: userId },
      sort: options.sort || [{ field: 'created_at', direction: 'DESC' }],
    });
  }

  public async getUnreadCount(userId: string): Promise<number> {
    const sql = `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0`;
    const rows = await this.db.query<{ unread_count: number }>(sql, [userId]);
    return Number(rows[0]?.unread_count || 0);
  }

  public async markAsRead(notificationId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(`UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ?`, [now, notificationId]);
  }

  public async markAllAsRead(userId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(`UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0`, [now, userId]);
  }
}
