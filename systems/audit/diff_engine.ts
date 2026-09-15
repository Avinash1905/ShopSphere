import { PIIProtector } from '../security/pii_protector.js';

export interface JSONPatchOp {
  op: 'add' | 'remove' | 'replace';
  path: string;
  value?: any;
  oldValue?: any;
}

export interface EntityDiffResult {
  hasChanges: boolean;
  changedFields: string[];
  oldSanitized: Record<string, any> | null;
  newSanitized: Record<string, any> | null;
  patches: JSONPatchOp[];
}

export class DiffEngine {
  /**
   * Computes granular field diffs, RFC 6902 patches, and automatically masks PII
   */
  public static diffObjects(
    oldObj: Record<string, any> | null | undefined,
    newObj: Record<string, any> | null | undefined
  ): EntityDiffResult {
    if (!oldObj && !newObj) {
      return { hasChanges: false, changedFields: [], oldSanitized: null, newSanitized: null, patches: [] };
    }

    const cleanOld = oldObj ? PIIProtector.sanitizeSensitiveData({ ...oldObj }) : null;
    const cleanNew = newObj ? PIIProtector.sanitizeSensitiveData({ ...newObj }) : null;

    if (!cleanOld && cleanNew) {
      const changedFields = Object.keys(cleanNew);
      const patches: JSONPatchOp[] = changedFields.map((f) => ({
        op: 'add',
        path: `/${f}`,
        value: cleanNew[f],
      }));
      return { hasChanges: true, changedFields, oldSanitized: null, newSanitized: cleanNew, patches };
    }

    if (cleanOld && !cleanNew) {
      const changedFields = Object.keys(cleanOld);
      const patches: JSONPatchOp[] = changedFields.map((f) => ({
        op: 'remove',
        path: `/${f}`,
        oldValue: cleanOld[f],
      }));
      return { hasChanges: true, changedFields, oldSanitized: cleanOld, newSanitized: null, patches };
    }

    const changedFields: string[] = [];
    const patches: JSONPatchOp[] = [];
    const allKeys = new Set([...Object.keys(cleanOld!), ...Object.keys(cleanNew!)]);

    for (const key of allKeys) {
      if (['updated_at', 'last_login_at'].includes(key)) continue; // Ignore benign timestamp updates

      const vOld = cleanOld![key];
      const vNew = cleanNew![key];

      const sOld = typeof vOld === 'object' ? JSON.stringify(vOld) : String(vOld);
      const sNew = typeof vNew === 'object' ? JSON.stringify(vNew) : String(vNew);

      if (vOld === undefined && vNew !== undefined) {
        changedFields.push(key);
        patches.push({ op: 'add', path: `/${key}`, value: vNew });
      } else if (vOld !== undefined && vNew === undefined) {
        changedFields.push(key);
        patches.push({ op: 'remove', path: `/${key}`, oldValue: vOld });
      } else if (sOld !== sNew) {
        changedFields.push(key);
        patches.push({ op: 'replace', path: `/${key}`, value: vNew, oldValue: vOld });
      }
    }

    return {
      hasChanges: changedFields.length > 0,
      changedFields,
      oldSanitized: cleanOld,
      newSanitized: cleanNew,
      patches,
    };
  }
}
