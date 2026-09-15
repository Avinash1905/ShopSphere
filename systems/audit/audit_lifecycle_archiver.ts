/**
 * ShopSphere Audit Subsystem - Audit Lifecycle & Archival Manager
 * Features:
 * - Hot-to-Cold storage tiering (90-day active retention)
 * - Compressed archive chunk generation with cryptographic checksum manifests
 * - Tamper-evident batch sealing
 */

import * as crypto from 'crypto';

export interface AuditRecordPayload {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
  hash: string;
  [key: string]: any;
}

export interface ArchiveManifest {
  archiveId: string;
  recordCount: number;
  startDate: string;
  endDate: string;
  manifestChecksum: string;
  rootMerkleHash: string;
  sealedAt: string;
}

export class AuditLifecycleArchiver {
  /**
   * Partitions records into active (hot) and archival (cold) batches
   */
  public static partitionByRetention(
    records: AuditRecordPayload[],
    retentionDays: number = 90,
    referenceDate: Date = new Date()
  ): { hotRecords: AuditRecordPayload[]; coldRecords: AuditRecordPayload[] } {
    const cutoff = referenceDate.getTime() - retentionDays * 24 * 60 * 60 * 1000;
    const hotRecords: AuditRecordPayload[] = [];
    const coldRecords: AuditRecordPayload[] = [];

    for (const r of records) {
      if (new Date(r.createdAt).getTime() < cutoff) {
        coldRecords.push(r);
      } else {
        hotRecords.push(r);
      }
    }

    return { hotRecords, coldRecords };
  }

  /**
   * Seals a batch of cold records into an immutable archive manifest
   */
  public static sealArchiveBatch(records: AuditRecordPayload[]): { manifest: ArchiveManifest; serializedData: string } {
    if (records.length === 0) {
      throw new Error('Cannot seal an empty archive batch.');
    }

    const sorted = [...records].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const serializedData = JSON.stringify(sorted);
    const manifestChecksum = crypto.createHash('sha256').update(serializedData).digest('hex');

    // Calculate root hash
    let runningHash = '';
    for (const r of sorted) {
      runningHash = crypto.createHash('sha256').update(runningHash + r.hash).digest('hex');
    }

    const manifest: ArchiveManifest = {
      archiveId: `archive-${crypto.randomUUID()}`,
      recordCount: sorted.length,
      startDate: new Date(sorted[0].createdAt).toISOString(),
      endDate: new Date(sorted[sorted.length - 1].createdAt).toISOString(),
      manifestChecksum,
      rootMerkleHash: runningHash,
      sealedAt: new Date().toISOString(),
    };

    return {
      manifest,
      serializedData,
    };
  }
}
