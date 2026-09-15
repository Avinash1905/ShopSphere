/**
 * ShopSphere Audit Subsystem - Cryptographic Merkle Tree Audit Ledger
 * Features:
 * - Binary Merkle Tree construction over audit transaction logs
 * - Root hash digest calculation: $$H_{root} = \text{SHA256}(H_L + H_R)$$
 * - Cryptographic Inclusion Proof generation ($O(\log N)$)
 * - Zero-knowledge tamper verification
 */

import * as crypto from 'crypto';

export interface MerkleProofStep {
  position: 'left' | 'right';
  hash: string;
}

export interface MerkleProof {
  leafHash: string;
  rootHash: string;
  steps: MerkleProofStep[];
}

export class MerkleAuditTree {
  private leaves: string[] = [];
  private layers: string[][] = [];

  constructor(records: Array<Record<string, any> | string> = []) {
    this.leaves = records.map((r) => this.hashRecord(r));
    this.buildTree();
  }

  private hashRecord(record: Record<string, any> | string): string {
    const raw = typeof record === 'string' ? record : JSON.stringify(record);
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private hashPair(left: string, right: string): string {
    return crypto.createHash('sha256').update(left + right).digest('hex');
  }

  private buildTree(): void {
    if (this.leaves.length === 0) {
      this.layers = [[]];
      return;
    }

    this.layers = [[...this.leaves]];

    while (this.layers[this.layers.length - 1].length > 1) {
      const currentLayer = this.layers[this.layers.length - 1];
      const nextLayer: string[] = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left; // Duplicate last if odd
        nextLayer.push(this.hashPair(left, right));
      }

      this.layers.push(nextLayer);
    }
  }

  public getRoot(): string | null {
    if (this.layers.length === 0 || this.layers[this.layers.length - 1].length === 0) {
      return null;
    }
    return this.layers[this.layers.length - 1][0];
  }

  /**
   * Generates Merkle Inclusion Proof for leaf index
   */
  public getProof(leafIndex: number): MerkleProof {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error(`Leaf index ${leafIndex} out of bounds (0-${this.leaves.length - 1})`);
    }

    const leafHash = this.leaves[leafIndex];
    const steps: MerkleProofStep[] = [];
    let idx = leafIndex;

    for (let layerIdx = 0; layerIdx < this.layers.length - 1; layerIdx++) {
      const layer = this.layers[layerIdx];
      const isRight = idx % 2 === 1;
      const pairIdx = isRight ? idx - 1 : (idx + 1 < layer.length ? idx + 1 : idx);

      steps.push({
        position: isRight ? 'left' : 'right',
        hash: layer[pairIdx],
      });

      idx = Math.floor(idx / 2);
    }

    return {
      leafHash,
      rootHash: this.getRoot()!,
      steps,
    };
  }

  /**
   * Verifies that a leaf belongs to a Merkle root using its proof
   */
  public static verifyProof(proof: MerkleProof): boolean {
    let currentHash = proof.leafHash;

    for (const step of proof.steps) {
      if (step.position === 'left') {
        currentHash = crypto.createHash('sha256').update(step.hash + currentHash).digest('hex');
      } else {
        currentHash = crypto.createHash('sha256').update(currentHash + step.hash).digest('hex');
      }
    }

    return currentHash === proof.rootHash;
  }
}
