import { createHash } from 'crypto';

export interface AuditBlock {
  index: number;
  timestamp: string;
  action: string;
  actorId: string;
  data: any;
  previousHash: string;
  hash: string;
}

export class TamperEvidentHashChain {
  private chain: AuditBlock[] = [];

  constructor() {
    this.createGenesisBlock();
  }

  private createGenesisBlock(): void {
    const genesis: AuditBlock = {
      index: 0,
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_INIT',
      actorId: 'system',
      data: { msg: 'ShopSphere Audit Genesis' },
      previousHash: '0',
      hash: ''
    };
    genesis.hash = this.computeHash(genesis);
    this.chain.push(genesis);
  }

  private computeHash(block: Omit<AuditBlock, 'hash'>): string {
    const raw = `${block.index}-${block.timestamp}-${block.action}-${block.actorId}-${JSON.stringify(block.data)}-${block.previousHash}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  public appendEvent(action: string, actorId: string, data: any): AuditBlock {
    const previous = this.chain[this.chain.length - 1];
    const block: AuditBlock = {
      index: previous.index + 1,
      timestamp: new Date().toISOString(),
      action,
      actorId,
      data,
      previousHash: previous.hash,
      hash: ''
    };
    block.hash = this.computeHash(block);
    this.chain.push(block);
    return block;
  }

  public verifyIntegrity(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const prev = this.chain[i - 1];
      if (current.previousHash !== prev.hash) return false;
      const expectedHash = this.computeHash({
        index: current.index,
        timestamp: current.timestamp,
        action: current.action,
        actorId: current.actorId,
        data: current.data,
        previousHash: current.previousHash
      });
      if (current.hash !== expectedHash) return false;
    }
    return true;
  }
}
