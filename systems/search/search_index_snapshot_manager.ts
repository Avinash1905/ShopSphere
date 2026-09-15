import crypto from 'crypto';

export interface IndexSnapshotMetadata {
  snapshotId: string;
  version: number;
  totalDocuments: number;
  totalTerms: number;
  createdAt: string;
  checksumSha256: string;
}

export interface IndexSnapshotData {
  metadata: IndexSnapshotMetadata;
  invertedIndexData: Record<string, Array<{ docId: string; termFrequency: number; positions: number[] }>>;
  documentStore: Record<string, any>;
}

export class SearchIndexSnapshotManager {
  private activeSlot: 'BLUE' | 'GREEN' = 'BLUE';
  private blueIndex: Map<string, any> = new Map();
  private greenIndex: Map<string, any> = new Map();
  private snapshots: Map<string, IndexSnapshotData> = new Map();

  /**
   * Computes SHA-256 integrity hash of snapshot payload
   */
  private computeChecksum(payload: string): string {
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Creates an immutable snapshot checkpoint of the current search index
   */
  public createSnapshot(
    indexData: Record<string, Array<{ docId: string; termFrequency: number; positions: number[] }>>,
    docStore: Record<string, any>
  ): IndexSnapshotData {
    const timestamp = new Date().toISOString();
    const docCount = Object.keys(docStore).length;
    const termCount = Object.keys(indexData).length;

    const payload = JSON.stringify({ indexData, docStore });
    const checksum = this.computeChecksum(payload);
    const snapshotId = `SNAP-${Date.now()}-${checksum.substring(0, 8)}`;

    const snapshot: IndexSnapshotData = {
      metadata: {
        snapshotId,
        version: this.snapshots.size + 1,
        totalDocuments: docCount,
        totalTerms: termCount,
        createdAt: timestamp,
        checksumSha256: checksum,
      },
      invertedIndexData: indexData,
      documentStore: docStore,
    };

    this.snapshots.set(snapshotId, snapshot);
    return snapshot;
  }

  /**
   * Restores snapshot with integrity verification
   */
  public restoreSnapshot(snapshot: IndexSnapshotData): boolean {
    const payload = JSON.stringify({
      indexData: snapshot.invertedIndexData,
      docStore: snapshot.documentStore,
    });
    const verifiedHash = this.computeChecksum(payload);

    if (verifiedHash !== snapshot.metadata.checksumSha256) {
      throw new Error(`Checksum validation failed: expected ${snapshot.metadata.checksumSha256} but computed ${verifiedHash}`);
    }

    // Load into inactive standby slot, then perform atomic pointer flip
    const targetSlot = this.activeSlot === 'BLUE' ? 'GREEN' : 'BLUE';
    const targetMap = targetSlot === 'GREEN' ? this.greenIndex : this.blueIndex;

    targetMap.clear();
    for (const [docId, doc] of Object.entries(snapshot.documentStore)) {
      targetMap.set(docId, doc);
    }

    // Atomic Blue/Green Switch
    this.activeSlot = targetSlot;
    return true;
  }

  public getActiveSlot(): 'BLUE' | 'GREEN' {
    return this.activeSlot;
  }

  public getActiveDocumentCount(): number {
    return this.activeSlot === 'BLUE' ? this.blueIndex.size : this.greenIndex.size;
  }

  public getSnapshotHistory(): IndexSnapshotMetadata[] {
    return Array.from(this.snapshots.values()).map((s) => s.metadata);
  }
}
