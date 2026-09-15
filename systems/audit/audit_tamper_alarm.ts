/**
 * ShopSphere Audit Subsystem - Hash-Chain Integrity Scanner & Tamper Alarm
 * Features:
 * - Scans sequential audit records verifying SHA-256 integrity hash chains:
 *   $$H_n = \text{SHA256}(H_{n-1} + \text{Payload}_n)$$
 * - Dispatches high-severity security alerts upon detecting corrupted hash links or modified history
 */

import * as crypto from 'crypto';

export interface ChainRecord {
  id: string;
  previousHash: string;
  hash: string;
  data: string;
  sequenceNumber: number;
}

export interface TamperScanResult {
  isChainIntact: boolean;
  totalRecordsScanned: number;
  corruptedRecordIndex?: number;
  corruptedRecordId?: string;
  alarmDispatched: boolean;
  message: string;
}

export class AuditTamperAlarm {
  /**
   * Scans an array of sequenced audit chain records
   */
  public static scanChain(records: ChainRecord[]): TamperScanResult {
    if (records.length === 0) {
      return {
        isChainIntact: true,
        totalRecordsScanned: 0,
        alarmDispatched: false,
        message: 'Empty audit ledger, chain is valid.',
      };
    }

    let expectedPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];

      // Check previous hash continuity
      if (rec.previousHash !== expectedPrevHash) {
        return {
          isChainIntact: false,
          totalRecordsScanned: i + 1,
          corruptedRecordIndex: i,
          corruptedRecordId: rec.id,
          alarmDispatched: true,
          message: `[SECURITY ALARM] Audit chain broken at record #${i} (${rec.id}): previousHash mismatch. Expected '${expectedPrevHash}', got '${rec.previousHash}'.`,
        };
      }

      // Recompute record SHA-256 digest
      const computedHash = crypto
        .createHash('sha256')
        .update(rec.previousHash + rec.data)
        .digest('hex');

      if (rec.hash !== computedHash) {
        return {
          isChainIntact: false,
          totalRecordsScanned: i + 1,
          corruptedRecordIndex: i,
          corruptedRecordId: rec.id,
          alarmDispatched: true,
          message: `[SECURITY ALARM] Tampered record detected at #${i} (${rec.id}): payload digest altered.`,
        };
      }

      expectedPrevHash = rec.hash;
    }

    return {
      isChainIntact: true,
      totalRecordsScanned: records.length,
      alarmDispatched: false,
      message: `Audit chain integrity verified across all ${records.length} sequential records.`,
    };
  }
}
