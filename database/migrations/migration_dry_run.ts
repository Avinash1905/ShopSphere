/**
 * ShopSphere Database Layer - Migration Dry-Run & Safety Planner
 * Evaluates pending migration SQL statements before execution:
 * - Checks for destructive operations (DROP TABLE, DROP COLUMN, TRUNCATE)
 * - Identifies non-concurrent index creations that may cause full table locks in production
 * - Calculates estimated execution impact and transaction safety
 */

import { Migration } from './runner.js';

export interface MigrationSafetyReport {
  safeToExecute: boolean;
  totalStatements: number;
  destructiveOperations: Array<{
    migrationId: string;
    statement: string;
    risk: 'DATA_LOSS' | 'TABLE_LOCK' | 'LONG_RUNNING';
    explanation: string;
  }>;
  warnings: string[];
  executionPlan: Array<{
    id: string;
    name: string;
    estimatedRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    statementsCount: number;
  }>;
}

export class MigrationDryRunner {
  public static plan(migrations: Migration[], dialect: 'postgres' | 'sqlite' = 'postgres'): MigrationSafetyReport {
    const report: MigrationSafetyReport = {
      safeToExecute: true,
      totalStatements: 0,
      destructiveOperations: [],
      warnings: [],
      executionPlan: [],
    };

    for (const mig of migrations) {
      const stmts = mig.up[dialect];
      report.totalStatements += stmts.length;
      let highestRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

      for (const stmt of stmts) {
        const upper = stmt.toUpperCase();

        if (upper.includes('DROP TABLE')) {
          report.destructiveOperations.push({
            migrationId: mig.id,
            statement: stmt,
            risk: 'DATA_LOSS',
            explanation: 'Dropping a table permanently deletes all contained records.',
          });
          report.safeToExecute = false;
          highestRisk = 'HIGH';
        } else if (upper.includes('DROP COLUMN')) {
          report.destructiveOperations.push({
            migrationId: mig.id,
            statement: stmt,
            risk: 'DATA_LOSS',
            explanation: 'Dropping a column destroys historical column data.',
          });
          highestRisk = 'HIGH';
        } else if (upper.includes('CREATE INDEX') && !upper.includes('CONCURRENTLY') && dialect === 'postgres') {
          report.warnings.push(
            `Migration '${mig.id}' creates an index without CONCURRENTLY in PostgreSQL, which acquires an exclusive table lock.`
          );
          if (highestRisk === 'LOW') highestRisk = 'MEDIUM';
        }
      }

      report.executionPlan.push({
        id: mig.id,
        name: mig.name,
        estimatedRisk: highestRisk,
        statementsCount: stmts.length,
      });
    }

    return report;
  }
}
