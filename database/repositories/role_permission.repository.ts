import { BaseRepository } from './base.repository.js';
import { RoleEntity, PermissionEntity } from '../schema/role_permission.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class RoleRepository extends BaseRepository<RoleEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('roles', db);
  }

  public async findByCode(code: string): Promise<RoleEntity | null> {
    return this.findOne({ code });
  }

  public async getUserRoles(userId: string): Promise<RoleEntity[]> {
    const sql = `
      SELECT r.* FROM roles r
      INNER JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
      ORDER BY r.priority ASC
    `;
    const rows = await this.db.query<RoleEntity>(sql, [userId]);
    return rows.map((r) => this.mapRow(r));
  }

  public async assignRoleToUser(userId: string, roleId: string, assignedBy?: string): Promise<void> {
    await this.db.execute(
      `INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)`,
      [userId, roleId, assignedBy || null]
    );
  }

  public async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.db.execute(`DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`, [userId, roleId]);
  }
}

export class PermissionRepository extends BaseRepository<PermissionEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('permissions', db);
  }

  public async findByCode(code: string): Promise<PermissionEntity | null> {
    return this.findOne({ code });
  }

  public async getRolePermissions(roleId: string): Promise<PermissionEntity[]> {
    const sql = `
      SELECT p.* FROM permissions p
      INNER JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `;
    const rows = await this.db.query<PermissionEntity>(sql, [roleId]);
    return rows.map((r) => this.mapRow(r));
  }

  public async getUserEffectivePermissions(userId: string): Promise<string[]> {
    const sql = `
      SELECT DISTINCT p.code FROM permissions p
      INNER JOIN role_permissions rp ON rp.permission_id = p.id
      INNER JOIN user_roles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = ?
    `;
    const rows = await this.db.query<{ code: string }>(sql, [userId]);
    return rows.map((r) => r.code);
  }

  public async userHasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const sql = `
      SELECT 1 FROM permissions p
      INNER JOIN role_permissions rp ON rp.permission_id = p.id
      INNER JOIN user_roles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = ? AND (p.code = ? OR p.code = '*:root')
      LIMIT 1
    `;
    const rows = await this.db.query(sql, [userId, permissionCode]);
    return rows.length > 0;
  }
}
