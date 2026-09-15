import crypto from 'crypto';

export interface SOC2EvidenceItem {
  controlId: string;
  trustServiceCategory: 'SECURITY' | 'AVAILABILITY' | 'CONFIDENTIALITY' | 'INTEGRITY' | 'PRIVACY';
  controlDescription: string;
  testProcedure: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';
  evidenceData: Record<string, any>;
  evaluatedAt: string;
}

export interface SOC2AuditPackage {
  packageId: string;
  periodStart: string;
  periodEnd: string;
  overallComplianceStatus: 'PASS' | 'QUALIFIED' | 'FAIL';
  compliantControlsCount: number;
  totalControlsCount: number;
  complianceRatePercent: number;
  evidenceItems: SOC2EvidenceItem[];
  packageIntegrityChecksum: string;
}

export class SOC2Type2EvidenceCollector {
  private evidence: SOC2EvidenceItem[] = [];

  /**
   * Records evidence for a specific SOC2 control
   */
  public recordEvidence(item: Omit<SOC2EvidenceItem, 'evaluatedAt'>): void {
    this.evidence.push({
      ...item,
      evaluatedAt: new Date().toISOString(),
    });
  }

  /**
   * Compiles and signs the complete SOC2 evidence package
   */
  public compilePackage(periodStart: string, periodEnd: string): SOC2AuditPackage {
    const total = this.evidence.length;
    const compliant = this.evidence.filter((e) => e.status === 'COMPLIANT').length;
    const rate = total > 0 ? Math.round((compliant / total) * 10000) / 100 : 100;

    const payload = JSON.stringify({
      periodStart,
      periodEnd,
      evidence: this.evidence,
    });
    const checksum = crypto.createHash('sha256').update(payload).digest('hex');
    const packageId = `SOC2-PKG-${Date.now()}-${checksum.substring(0, 8)}`;

    return {
      packageId,
      periodStart,
      periodEnd,
      overallComplianceStatus: rate >= 95 ? 'PASS' : rate >= 80 ? 'QUALIFIED' : 'FAIL',
      compliantControlsCount: compliant,
      totalControlsCount: total,
      complianceRatePercent: rate,
      evidenceItems: [...this.evidence],
      packageIntegrityChecksum: checksum,
    };
  }
}
