import { MigrationDatabaseAdapter } from '../../database/migrations/runner.js';
import { ImmutableAuditStore } from './audit_storage.js';
import { AuditQueryEngine } from './audit_query_engine.js';
import { ComplianceReporter } from './compliance_reporter.js';
import { AuditInterceptor } from './audit_interceptor.js';

export class AuditService {
  public store: ImmutableAuditStore;
  public queryEngine: AuditQueryEngine;
  public compliance: ComplianceReporter;
  public interceptor: AuditInterceptor;

  constructor(db: MigrationDatabaseAdapter) {
    this.store = new ImmutableAuditStore(db);
    this.queryEngine = new AuditQueryEngine(db);
    this.compliance = new ComplianceReporter(this.queryEngine);
    this.interceptor = new AuditInterceptor(this.store);
  }
}
