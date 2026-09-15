export interface TransitionEntry {
  orderId: string;
  fromStatus: string;
  toStatus: string;
  timestamp: string;
  actorId: string;
  actorRole: 'customer' | 'seller' | 'admin' | 'system';
  reason?: string;
  payloadHash?: string;
}

export class OrderTransitionLedger {
  private ledger: Map<string, TransitionEntry[]> = new Map();

  public recordTransition(entry: Omit<TransitionEntry, 'timestamp'>): TransitionEntry {
    const record: TransitionEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    const list = this.ledger.get(entry.orderId) || [];
    list.push(record);
    this.ledger.set(entry.orderId, list);
    return record;
  }

  public getHistory(orderId: string): readonly TransitionEntry[] {
    return this.ledger.get(orderId) || [];
  }

  public getLastTransition(orderId: string): TransitionEntry | undefined {
    const list = this.getHistory(orderId);
    return list.length > 0 ? list[list.length - 1] : undefined;
  }
}
