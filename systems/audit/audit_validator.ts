import { AuditRecordPayload } from './audit_types.js';

export class AuditValidator {
  public static validateRecord(record: AuditRecordPayload): { isValid: boolean; error?: string } {
    if (!record.action || typeof record.action !== 'string') {
      return { isValid: false, error: 'Audit record missing mandatory action string' };
    }
    if (!record.entityName || typeof record.entityName !== 'string') {
      return { isValid: false, error: 'Audit record missing entityName' };
    }
    if (!record.entityId || typeof record.entityId !== 'string') {
      return { isValid: false, error: 'Audit record missing entityId' };
    }
    return { isValid: true };
  }
}
