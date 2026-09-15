import crypto from 'crypto';

export interface AuditBlockEntry {
  entryId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  payloadHash: string;
  timestamp: string;
}

export interface LedgerBlock {
  blockIndex: number;
  previousBlockHash: string;
  blockHash: string;
  merkleRoot: string;
  timestamp: string;
  nonce: number;
  entries: AuditBlockEntry[];
}

export class ImmutableCryptographicLedger {
  private chain: LedgerBlock[] = [];
  private pendingEntries: AuditBlockEntry[] = [];
  private blockSize: number;

  constructor(blockSize: number = 5) {
    this.blockSize = blockSize;
    this.createGenesisBlock();
  }

  private createGenesisBlock(): void {
    const genesisEntries: AuditBlockEntry[] = [
      {
        entryId: 'GENESIS-0',
        actorUserId: 'SYSTEM_ROOT',
        action: 'LEDGER_INITIALIZED',
        entityType: 'AUDIT_LEDGER',
        entityId: 'ROOT',
        payloadHash: crypto.createHash('sha256').update('GENESIS').digest('hex'),
        timestamp: new Date().toISOString(),
      },
    ];

    const merkleRoot = this.computeMerkleRoot(genesisEntries);
    const hash = this.calculateBlockHash(0, '0'.repeat(64), merkleRoot, genesisEntries[0].timestamp, 0);

    const genesisBlock: LedgerBlock = {
      blockIndex: 0,
      previousBlockHash: '0'.repeat(64),
      blockHash: hash,
      merkleRoot,
      timestamp: genesisEntries[0].timestamp,
      nonce: 0,
      entries: genesisEntries,
    };

    this.chain.push(genesisBlock);
  }

  private calculateBlockHash(
    index: number,
    prevHash: string,
    merkleRoot: string,
    timestamp: string,
    nonce: number
  ): string {
    const data = `${index}:${prevHash}:${merkleRoot}:${timestamp}:${nonce}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private computeMerkleRoot(entries: AuditBlockEntry[]): string {
    if (entries.length === 0) return '0'.repeat(64);
    let hashes = entries.map((e) =>
      crypto.createHash('sha256').update(JSON.stringify(e)).digest('hex')
    );

    while (hashes.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        if (i + 1 < hashes.length) {
          const combined = hashes[i] + hashes[i + 1];
          nextLevel.push(crypto.createHash('sha256').update(combined).digest('hex'));
        } else {
          nextLevel.push(hashes[i]);
        }
      }
      hashes = nextLevel;
    }

    return hashes[0];
  }

  /**
   * Appends an audit entry. When pending reaches blockSize, a new block is mined/sealed.
   */
  public appendEntry(entry: Omit<AuditBlockEntry, 'entryId' | 'timestamp'>): void {
    const fullEntry: AuditBlockEntry = {
      ...entry,
      entryId: `AUD-LEDGER-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };

    this.pendingEntries.push(fullEntry);

    if (this.pendingEntries.length >= this.blockSize) {
      this.sealBlock();
    }
  }

  /**
   * Seals pending entries into an immutable hash-chained block
   */
  public sealBlock(): LedgerBlock {
    if (this.pendingEntries.length === 0) {
      throw new Error('Cannot seal an empty block');
    }

    const previousBlock = this.chain[this.chain.length - 1];
    const blockIndex = this.chain.length;
    const timestamp = new Date().toISOString();
    const entriesToSeal = [...this.pendingEntries];
    this.pendingEntries = [];

    const merkleRoot = this.computeMerkleRoot(entriesToSeal);
    const blockHash = this.calculateBlockHash(
      blockIndex,
      previousBlock.blockHash,
      merkleRoot,
      timestamp,
      0
    );

    const newBlock: LedgerBlock = {
      blockIndex,
      previousBlockHash: previousBlock.blockHash,
      blockHash,
      merkleRoot,
      timestamp,
      nonce: 0,
      entries: entriesToSeal,
    };

    this.chain.push(newBlock);
    return newBlock;
  }

  /**
   * Verifies the cryptographic integrity of the entire chain from Genesis
   */
  public verifyChainIntegrity(): { isValid: boolean; violatedBlockIndex?: number } {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // 1. Verify previous block hash pointer
      if (current.previousBlockHash !== previous.blockHash) {
        return { isValid: false, violatedBlockIndex: i };
      }

      // 2. Verify merkle root
      const computedMerkle = this.computeMerkleRoot(current.entries);
      if (current.merkleRoot !== computedMerkle) {
        return { isValid: false, violatedBlockIndex: i };
      }

      // 3. Verify block hash
      const computedHash = this.calculateBlockHash(
        current.blockIndex,
        current.previousBlockHash,
        current.merkleRoot,
        current.timestamp,
        current.nonce
      );
      if (current.blockHash !== computedHash) {
        return { isValid: false, violatedBlockIndex: i };
      }
    }

    return { isValid: true };
  }

  public getBlockCount(): number {
    return this.chain.length;
  }
}
