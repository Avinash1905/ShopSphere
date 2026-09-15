import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const RolePermissionSeeder: Seeder = {
  name: 'RolePermissionSeeder',
  order: 1,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    const roles = [
      { id: 'role-super-admin', name: 'Super Administrator', code: 'SUPER_ADMIN', priority: 1, is_system: true, desc: 'Complete root access' },
      { id: 'role-admin', name: 'Platform Administrator', code: 'ADMIN', priority: 10, is_system: true, desc: 'Platform management and moderation' },
      { id: 'role-seller', name: 'Merchant Seller', code: 'SELLER', priority: 50, is_system: true, desc: 'Store management and order fulfillment' },
      { id: 'role-customer', name: 'Retail Customer', code: 'CUSTOMER', priority: 100, is_system: true, desc: 'Browse catalog, cart, and orders' },
      { id: 'role-auditor', name: 'Compliance Auditor', code: 'AUDITOR', priority: 30, is_system: false, desc: 'Read-only access to audit logs and metrics' },
      { id: 'role-support', name: 'Support Representative', code: 'SUPPORT', priority: 60, is_system: false, desc: 'Customer ticket and order resolution' },
      { id: 'role-inventory-mgr', name: 'Inventory Manager', code: 'INVENTORY_MANAGER', priority: 40, is_system: false, desc: 'Stock level adjustment and receipts' },
    ];

    for (const r of roles) {
      await db.execute(
        `INSERT OR IGNORE INTO roles (id, name, code, description, is_system_role, priority) VALUES (?, ?, ?, ?, ?, ?)`,
        [r.id, r.name, r.code, r.desc, r.is_system, r.priority]
      );
    }

    const modules = ['users', 'roles', 'sellers', 'products', 'categories', 'inventory', 'orders', 'payments', 'coupons', 'reviews', 'analytics', 'audit'];
    const actions = ['read', 'create', 'update', 'delete', 'export', 'approve', 'refund'];
    let permCount = 0;

    for (const mod of modules) {
      for (const act of actions) {
        const permCode = `${mod}:${act}`;
        const permId = `perm-${mod}-${act}`;
        await db.execute(
          `INSERT OR IGNORE INTO permissions (id, module, action, code, description, is_system_permission) VALUES (?, ?, ?, ?, ?, ?)`,
          [permId, mod, act, permCode, `Permission to ${act} in ${mod} module`, true]
        );
        permCount++;

        // Super Admin gets all permissions
        await db.execute(
          `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          ['role-super-admin', permId]
        );

        // Seller permissions
        if (['products', 'inventory', 'orders', 'sellers', 'reviews'].includes(mod) && ['read', 'create', 'update'].includes(act)) {
          await db.execute(
            `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            ['role-seller', permId]
          );
        }

        // Customer permissions
        if ((['products', 'categories', 'reviews'].includes(mod) && act === 'read') ||
            (mod === 'orders' && ['create', 'read'].includes(act)) ||
            (mod === 'reviews' && ['create', 'update'].includes(act))) {
          await db.execute(
            `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            ['role-customer', permId]
          );
        }

        // Auditor permissions
        if (['audit', 'analytics', 'orders', 'payments'].includes(mod) && ['read', 'export'].includes(act)) {
          await db.execute(
            `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            ['role-auditor', permId]
          );
        }
      }
    }

    return { count: roles.length + permCount, entityName: 'roles_and_permissions' };
  },
};
