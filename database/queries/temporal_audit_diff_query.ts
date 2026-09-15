import { QueryBuilder } from './query_builder.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface FieldChangeDelta {
  fieldName: string;
  oldValue: any;
  newValue: any;
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
}

export interface EntityVersionDiff {
  entityType: string;
  entityId: string;
  fromVersionNumber: number;
  toVersionNumber: number;
  actorUserId?: string;
  changedAt: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  fieldDeltas: FieldChangeDelta[];
  changeSummary: string;
}

export interface EntityTimelineHistory {
  entityType: string;
  entityId: string;
  totalRevisions: number;
  createdAt: string;
  lastModifiedAt: string;
  timeline: Array<{
    revisionId: string;
    version: number;
    action: string;
    actor: string;
    timestamp: string;
    diffSummary: string;
  }>;
}

export class TemporalAuditDiffQueryEngine {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Compares two JSON snapshots and generates structured field-level diffs
   */
  public computeStateDiff(
    oldState: Record<string, any> = {},
    newState: Record<string, any> = {}
  ): FieldChangeDelta[] {
    const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
    const deltas: FieldChangeDelta[] = [];

    for (const key of allKeys) {
      const oldVal = oldState[key];
      const newVal = newState[key];

      if (oldVal === undefined && newVal !== undefined) {
        deltas.push({ fieldName: key, oldValue: null, newValue: newVal, changeType: 'ADDED' });
      } else if (oldVal !== undefined && newVal === undefined) {
        deltas.push({ fieldName: key, oldValue: oldVal, newValue: null, changeType: 'REMOVED' });
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        deltas.push({ fieldName: key, oldValue: oldVal, newValue: newVal, changeType: 'MODIFIED' });
      }
    }

    return deltas;
  }

  /**
   * Queries audit log revisions to reconstruct entity history timeline
   */
  public async getEntityTimeline(
    entityType: string,
    entityId: string
  ): Promise<EntityTimelineHistory> {
    const qb = QueryBuilder.select(
      'id',
      'user_id',
      'action',
      'entity_type',
      'entity_id',
      'old_values',
      'new_values',
      'created_at'
    )
      .from('audit_logs')
      .where('entity_type = ?', entityType)
      .where('entity_id = ?', entityId)
      .orderBy('created_at', 'ASC');

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<any>(sql, params);

    const timeline = rows.map((r: any, idx: number) => {
      let oldS: Record<string, any> = {};
      let newS: Record<string, any> = {};
      try {
        if (typeof r.old_values === 'string') oldS = JSON.parse(r.old_values);
        else if (r.old_values) oldS = r.old_values;
      } catch { /* ignore */ }

      try {
        if (typeof r.new_values === 'string') newS = JSON.parse(r.new_values);
        else if (r.new_values) newS = r.new_values;
      } catch { /* ignore */ }

      const deltas = this.computeStateDiff(oldS, newS);
      const summary = deltas.length > 0
        ? `Modified ${deltas.length} fields (${deltas.map((d) => d.fieldName).slice(0, 3).join(', ')}${deltas.length > 3 ? '...' : ''})`
        : r.action;

      return {
        revisionId: r.id,
        version: idx + 1,
        action: r.action,
        actor: r.user_id || 'SYSTEM',
        timestamp: r.created_at,
        diffSummary: summary,
      };
    });

    return {
      entityType,
      entityId,
      totalRevisions: timeline.length,
      createdAt: timeline[0]?.timestamp || new Date().toISOString(),
      lastModifiedAt: timeline[timeline.length - 1]?.timestamp || new Date().toISOString(),
      timeline,
    };
  }

  /**
   * Reconstructs the exact state of an entity as-of a specific point in time
   */
  public async reconstructAsOf(
    entityType: string,
    entityId: string,
    asOfTimestamp: string
  ): Promise<Record<string, any> | null> {
    const qb = QueryBuilder.select('action', 'new_values', 'created_at')
      .from('audit_logs')
      .where('entity_type = ?', entityType)
      .where('entity_id = ?', entityId)
      .where('created_at <= ?', asOfTimestamp)
      .orderBy('created_at', 'ASC');

    const { sql, params } = qb.toSQL();
    const rows = await this.db.query<any>(sql, params);

    if (rows.length === 0) return null;

    let reconstructedState: Record<string, any> = {};

    for (const r of rows) {
      if (r.action === 'DELETE') {
        reconstructedState = {};
      } else if (r.new_values) {
        try {
          const parsed = typeof r.new_values === 'string' ? JSON.parse(r.new_values) : r.new_values;
          reconstructedState = { ...reconstructedState, ...parsed };
        } catch { /* ignore */ }
      }
    }

    return reconstructedState;
  }
}
