import * as crypto from 'crypto';
import { GLJournalEntryTable, GLJournalEntryLineTable } from '../../database/schema/general_ledger.schema.js';

export interface AuditAttestationCertificate {
  periodId: string;
  fiscalYear: number;
  periodNumber: number;
  totalJournalEntries: number;
  totalDebits: number;
  totalCredits: number;
  merkleRootHash: string;
  hmacSignature: string;
  sealedAt: string;
  sealedByUserId: string;
  isTamperFree: boolean;
}

export class AntiTamperAuditSeal {
  /**
   * Generates a cryptographic Merkle hash over a sequence of journal entries and lines
   */
  public static computePeriodMerkleRoot(
    entries: GLJournalEntryTable[],
    lines: GLJournalEntryLineTable[]
  ): string {
    if (entries.length === 0) {
      return crypto.createHash('sha256').update('EMPTY_PERIOD').digest('hex');
    }

    // Sort entries deterministically by entry number
    const sortedEntries = [...entries].sort((a, b) => a.entry_number.localeCompare(b.entry_number));

    const lineMap: Record<string, GLJournalEntryLineTable[]> = {};
    for (const l of lines) {
      if (!lineMap[l.journal_entry_id]) {
        lineMap[l.journal_entry_id] = [];
      }
      lineMap[l.journal_entry_id].push(l);
    }

    const leafHashes: string[] = sortedEntries.map(e => {
      const eLines = (lineMap[e.id] || []).sort((a, b) => a.line_number - b.line_number);
      const linesDigest = eLines
        .map(l => `${l.account_code}:${l.debit_amount}:${l.credit_amount}:${l.foreign_amount || 0}`)
        .join('|');

      const entryPayload = `${e.id}|${e.entry_number}|${e.posting_date}|${e.total_debit}|${e.total_credit}|${e.status}|${linesDigest}`;
      return crypto.createHash('sha256').update(entryPayload).digest('hex');
    });

    // Build Merkle tree upward
    let currentLevel = leafHashes;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLevel.push(combined);
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  /**
   * Seals a fiscal period with an HMAC signature and generates an immutable attestation certificate
   */
  public static sealFiscalPeriod(
    periodId: string,
    fiscalYear: number,
    periodNumber: number,
    userId: string,
    entries: GLJournalEntryTable[],
    lines: GLJournalEntryLineTable[],
    signingSecret: string = 'SECURE_GL_AUDIT_KEY_2026'
  ): AuditAttestationCertificate {
    const merkleRoot = this.computePeriodMerkleRoot(entries, lines);
    const totalDebits = entries.reduce((sum, e) => sum + e.total_debit, 0);
    const totalCredits = entries.reduce((sum, e) => sum + e.total_credit, 0);

    const certificatePayload = `PERIOD:${periodId}|YEAR:${fiscalYear}|NUM:${periodNumber}|MERKLE:${merkleRoot}|DEBITS:${totalDebits}|CREDITS:${totalCredits}|SEALER:${userId}`;
    const hmacSignature = crypto.createHmac('sha256', signingSecret).update(certificatePayload).digest('hex');

    return {
      periodId,
      fiscalYear,
      periodNumber,
      totalJournalEntries: entries.length,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      merkleRootHash: merkleRoot,
      hmacSignature,
      sealedAt: new Date().toISOString(),
      sealedByUserId: userId,
      isTamperFree: true,
    };
  }

  /**
   * Verifies that existing journal entries match the original cryptographic audit certificate
   */
  public static verifyPeriodSeal(
    certificate: AuditAttestationCertificate,
    currentEntries: GLJournalEntryTable[],
    currentLines: GLJournalEntryLineTable[],
    signingSecret: string = 'SECURE_GL_AUDIT_KEY_2026'
  ): boolean {
    const computedMerkle = this.computePeriodMerkleRoot(currentEntries, currentLines);
    if (computedMerkle !== certificate.merkleRootHash) {
      return false; // Tampering detected in journal entries or line items!
    }

    const totalDebits = currentEntries.reduce((sum, e) => sum + e.total_debit, 0);
    const totalCredits = currentEntries.reduce((sum, e) => sum + e.total_credit, 0);

    const certificatePayload = `PERIOD:${certificate.periodId}|YEAR:${certificate.fiscalYear}|NUM:${certificate.periodNumber}|MERKLE:${computedMerkle}|DEBITS:${totalDebits}|CREDITS:${totalCredits}|SEALER:${certificate.sealedByUserId}`;
    const expectedSignature = crypto.createHmac('sha256', signingSecret).update(certificatePayload).digest('hex');

    return expectedSignature === certificate.hmacSignature;
  }
}
