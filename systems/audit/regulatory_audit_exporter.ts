import crypto from 'crypto';

export interface AuditExportRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  severity: string;
  ipAddress?: string;
  sanitizedDetails: string;
}

export interface SignedAuditExportPackage {
  exportId: string;
  standard: 'ISO_27001' | 'PCI_DSS_4_0' | 'HIPAA_SECURITY_RULE';
  generatedAt: string;
  totalRecords: number;
  recordsJson: string;
  recordsCsv: string;
  digitalSignatureSha256: string;
}

export class RegulatoryAuditExporter {
  private signingKey: string;

  constructor() {
    this.signingKey = crypto.randomBytes(32).toString('hex');
  }

  /**
   * Exports sanitized and cryptographically signed audit package
   */
  public exportPackage(
    records: AuditExportRecord[],
    standard: 'ISO_27001' | 'PCI_DSS_4_0' | 'HIPAA_SECURITY_RULE' = 'ISO_27001'
  ): SignedAuditExportPackage {
    const timestamp = new Date().toISOString();
    const exportId = `EXP-${standard}-${Date.now()}`;

    const jsonString = JSON.stringify(records, null, 2);

    // CSV format conversion
    const headers = ['id', 'timestamp', 'actor', 'action', 'entityType', 'entityId', 'severity', 'ipAddress', 'details'];
    const rows = records.map((r) => [
      r.id,
      r.timestamp,
      r.actor,
      r.action,
      r.entityType,
      r.entityId,
      r.severity,
      r.ipAddress || '',
      `"${r.sanitizedDetails.replace(/"/g, '""')}"`,
    ].join(','));
    const csvString = [headers.join(','), ...rows].join('\n');

    const signature = crypto.createHmac('sha256', this.signingKey).update(jsonString + csvString).digest('hex');

    return {
      exportId,
      standard,
      generatedAt: timestamp,
      totalRecords: records.length,
      recordsJson: jsonString,
      recordsCsv: csvString,
      digitalSignatureSha256: signature,
    };
  }

  public verifyPackageSignature(pkg: SignedAuditExportPackage): boolean {
    const expected = crypto.createHmac('sha256', this.signingKey).update(pkg.recordsJson + pkg.recordsCsv).digest('hex');
    return pkg.digitalSignatureSha256 === expected;
  }
}
