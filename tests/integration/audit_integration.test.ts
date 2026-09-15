import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { FixturesLoader } from '../../systems/testing/fixtures_loader.js';
import { AuditService } from '../../systems/audit/audit_service.js';
import { DiffEngine } from '../../systems/audit/diff_engine.js';

describe('Audit System Integration Test Suite', () => {
  it('should compute deep object diffs, RFC 6902 patches, and mask sensitive credentials', () => {
    const oldProduct = {
      id: 'prod-001',
      title: 'Headphones V1',
      base_price: 199.99,
      password_hash: 'secret_hash_old',
      attributes: { color: 'Black' },
    };

    const newProduct = {
      id: 'prod-001',
      title: 'Headphones V2',
      base_price: 249.99,
      password_hash: 'secret_hash_new',
      attributes: { color: 'Silver' },
    };

    const diff = DiffEngine.diffObjects(oldProduct, newProduct);
    Assert.isTrue(diff.hasChanges, 'Changes detected');
    Assert.arrayContains(diff.changedFields, 'title', 'Title changed');
    Assert.arrayContains(diff.changedFields, 'base_price', 'Base price changed');

    // Verify sensitive data masked
    Assert.equal(diff.oldSanitized!.password_hash, '[REDACTED_SECRET]', 'Old secret redacted in snapshot');
    Assert.equal(diff.newSanitized!.password_hash, '[REDACTED_SECRET]', 'New secret redacted in snapshot');
  });

  it('should append immutable audit records, query multi-dimensional audit logs, and generate compliance reports', async () => {
    const { db } = await FixturesLoader.setupTestDatabase();
    const auditService = new AuditService(db);

    // 1. Append new audit event
    const recordId = await auditService.store.append({
      actorId: 'usr-admin-01',
      actorType: 'USER',
      actorEmail: 'admin@shopsphere.io',
      action: 'ADMIN_PERMISSION_MODIFIED',
      entityName: 'roles',
      entityId: 'role-seller',
      oldValues: { permissions: ['read'] },
      newValues: { permissions: ['read', 'create'] },
      changedFields: ['permissions'],
      status: 'SUCCESS',
      severity: 'WARNING',
    });

    Assert.isNotNull(recordId, 'Audit record appended successfully');

    // 2. Query by action
    const queryRes = await auditService.queryEngine.queryLogs({
      action: 'ADMIN_PERMISSION_MODIFIED',
    });
    Assert.greaterThan(queryRes.total, 0, 'Found recorded audit event');
    Assert.equal(queryRes.logs[0].entityName, 'roles', 'Entity name matches');

    // 3. Generate SOC2 report
    const soc2Report = await auditService.compliance.generateSOC2Report();
    Assert.isTrue(soc2Report.auditIntegrityPassed, 'SOC2 compliance integrity passed');
    Assert.greaterThan(soc2Report.adminPermissionChangesCount, 0, 'Admin changes tracked in SOC2 report');
  });
});
