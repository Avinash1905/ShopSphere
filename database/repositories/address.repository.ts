import { BaseRepository } from './base.repository.js';
import { AddressEntity } from '../schema/address.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class AddressRepository extends BaseRepository<AddressEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('addresses', db);
  }

  public async getUserAddresses(userId: string): Promise<AddressEntity[]> {
    const sql = `SELECT * FROM addresses WHERE user_id = ? AND deleted_at IS NULL ORDER BY is_default_shipping DESC, is_default_billing DESC, created_at DESC`;
    const rows = await this.db.query<AddressEntity>(sql, [userId]);
    return rows.map((r) => this.mapRow(r));
  }

  public async setDefaultShipping(userId: string, addressId: string): Promise<void> {
    await this.db.execute(`UPDATE addresses SET is_default_shipping = 0 WHERE user_id = ?`, [userId]);
    await this.db.execute(`UPDATE addresses SET is_default_shipping = 1 WHERE id = ? AND user_id = ?`, [addressId, userId]);
  }

  public async setDefaultBilling(userId: string, addressId: string): Promise<void> {
    await this.db.execute(`UPDATE addresses SET is_default_billing = 0 WHERE user_id = ?`, [userId]);
    await this.db.execute(`UPDATE addresses SET is_default_billing = 1 WHERE id = ? AND user_id = ?`, [addressId, userId]);
  }
}
