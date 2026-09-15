export interface NetworkPartitionRule {
  fromNode: string;
  toNode: string;
  isPartitioned: boolean;
  packetLossRate: number; // 0.0 (no loss) to 1.0 (100% loss)
  latencyJitterMs: number;
}

export class ChaosNetworkPartitionSimulator {
  private partitions: Map<string, NetworkPartitionRule> = new Map();
  private isEnabled: boolean = true;

  private makeKey(from: string, to: string): string {
    return `${from}->${to}`;
  }

  /**
   * Partitions network connection between two nodes
   */
  public partitionNodes(fromNode: string, toNode: string, packetLoss: number = 1.0, jitterMs: number = 0): void {
    this.partitions.set(this.makeKey(fromNode, toNode), {
      fromNode,
      toNode,
      isPartitioned: true,
      packetLossRate: packetLoss,
      latencyJitterMs: jitterMs,
    });
    // Bidirectional
    this.partitions.set(this.makeKey(toNode, fromNode), {
      fromNode: toNode,
      toNode: fromNode,
      isPartitioned: true,
      packetLossRate: packetLoss,
      latencyJitterMs: jitterMs,
    });
  }

  /**
   * Heals the network partition between two nodes
   */
  public healPartition(fromNode: string, toNode: string): void {
    this.partitions.delete(this.makeKey(fromNode, toNode));
    this.partitions.delete(this.makeKey(toNode, fromNode));
  }

  /**
   * Simulates network transmission with chaos partition and jitter effects
   */
  public async transmit<T>(
    fromNode: string,
    toNode: string,
    payloadFn: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnabled) {
      return payloadFn();
    }

    const rule = this.partitions.get(this.makeKey(fromNode, toNode));
    if (rule && rule.isPartitioned) {
      if (rule.latencyJitterMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, rule.latencyJitterMs));
      }

      if (Math.random() < rule.packetLossRate) {
        throw new Error(`[ChaosNetworkPartition] Connection reset between '${fromNode}' and '${toNode}' (Network Partition / Packet Dropped)`);
      }
    }

    return payloadFn();
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public clearAllPartitions(): void {
    this.partitions.clear();
  }
}
