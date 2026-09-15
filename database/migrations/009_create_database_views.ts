/**
 * Migration 009: Create Database Views for Reporting & Search Acceleration
 */

import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';
import { ViewRegistry } from '../schema/view_definitions.js';

export const Migration009CreateDatabaseViews: MigrationStep = {
  name: '009_create_database_views',
  version: '20260915000009',
  description: 'Create reporting and catalog search optimization views',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    for (const sql of ViewRegistry.generateAllViewsDDL('sqlite')) {
      await db.execute(sql);
    }
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP VIEW IF EXISTS v_product_catalog_search;');
    await db.execute('DROP VIEW IF EXISTS v_seller_performance_summary;');
    await db.execute('DROP VIEW IF EXISTS v_inventory_stock_alerts;');
  },
};
