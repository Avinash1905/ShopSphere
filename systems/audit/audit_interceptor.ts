import { DiffEngine } from './diff_engine.js';
import { ImmutableAuditStore } from './audit_storage.js';
import { AuditAction, AuditRecordPayload } from './audit_types.js';

export class AuditInterceptor {
  private store: ImmutableAuditStore;

  constructor(store: ImmutableAuditStore) {
    this.store = store;
  }

  public async captureMutation<T extends { id: string }>(
    entityName: string,
    action: AuditAction | string,
    actorId: string | undefined,
    oldState: T | null,
    newState: T | null,
    metadata?: Record<string, any>
  ): Promise<AuditRecordPayload | null> {
    const diff = DiffEngine.diffObjects(oldState, newState);
    if (!diff.hasChanges && action.includes('UPDATE')) {
      return null;
    }

    const targetId = newState?.id || oldState?.id || 'unknown';

    const payload: AuditRecordPayload = {
      actorId,
      actorType: actorId ? 'USER' : 'SYSTEM',
      action,
      entityName,
      entityId: targetId,
      oldValues: diff.oldSanitized,
      newValues: diff.newSanitized,
      changedFields: diff.changedFields,
      status: 'SUCCESS',
      severity: 'INFO',
      metadata: {
        ...metadata,
        patchCount: diff.patches.length,
      },
      timestamp: new Date().toISOString(),
    };

    await this.store.append(payload);
    return payload;
  }
}
