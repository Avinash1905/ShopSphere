import { BaseRepository } from './base.repository.js';
import { UserEntity } from '../schema/user.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class UserRepository extends BaseRepository<UserEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('users', db);
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    return this.findOne({ email: email.toLowerCase().trim() });
  }

  public async findByPhoneNumber(phone: string): Promise<UserEntity | null> {
    return this.findOne({ phone_number: phone.trim() });
  }

  public async recordSuccessfulLogin(userId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, userId]
    );
  }

  public async recordFailedLogin(userId: string, maxAttempts: number = 5, lockoutDurationMinutes: number = 15): Promise<{ locked: boolean; attempts: number }> {
    const user = await this.findById(userId);
    if (!user) return { locked: false, attempts: 0 };

    const newAttempts = (user.failed_login_attempts || 0) + 1;
    let lockoutUntil: string | null = null;
    let locked = false;

    if (newAttempts >= maxAttempts) {
      locked = true;
      const lockoutDate = new Date(Date.now() + lockoutDurationMinutes * 60 * 1000);
      lockoutUntil = lockoutDate.toISOString();
    }

    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE users SET failed_login_attempts = ?, lockout_until = ?, updated_at = ? WHERE id = ?`,
      [newAttempts, lockoutUntil, now, userId]
    );

    return { locked, attempts: newAttempts };
  }

  public async updatePassword(userId: string, passwordHash: string, salt: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE users SET password_hash = ?, salt = ?, last_password_change_at = ?, failed_login_attempts = 0, lockout_until = NULL, updated_at = ? WHERE id = ?`,
      [passwordHash, salt, now, now, userId]
    );
  }

  public async updateVerificationStatus(userId: string, emailVerified?: boolean, phoneVerified?: boolean): Promise<void> {
    const updates: Record<string, any> = {};
    if (emailVerified !== undefined) updates.email_verified = emailVerified ? 1 : 0;
    if (phoneVerified !== undefined) updates.phone_verified = phoneVerified ? 1 : 0;
    if (Object.keys(updates).length === 0) return;

    const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
    const params = [...Object.values(updates), new Date().toISOString(), userId];
    await this.db.execute(`UPDATE users SET ${setClauses}, updated_at = ? WHERE id = ?`, params);
  }
}
