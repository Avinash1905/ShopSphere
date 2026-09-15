import { MockDatabaseAdapter } from './mock_database.js';

export type MockTxIsolationLevel = 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';

export interface TransactionSnapshot {
  savepointName: string;
  stateData: Map<string, any[]>;
  timestamp: number;
}

export class DeadlockGraph {
  private waitGraph: Map<string, Set<string>> = new Map();

  public addDependency(waitingTxId: string, holdingTxId: string): void {
    if (!this.waitGraph.has(waitingTxId)) {
      this.waitGraph.set(waitingTxId, new Set());
    }
    this.waitGraph.get(waitingTxId)!.add(holdingTxId);
  }

  public removeDependency(waitingTxId: string, holdingTxId: string): void {
    if (this.waitGraph.has(waitingTxId)) {
      this.waitGraph.get(waitingTxId)!.delete(holdingTxId);
    }
  }

  public removeTx(txId: string): void {
    this.waitGraph.delete(txId);
    for (const [_, set] of this.waitGraph) {
      set.delete(txId);
    }
  }

  public detectCycle(): string[] | null {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = this.waitGraph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          path.push(neighbor);
          return true;
        }
      }

      recStack.delete(node);
      path.pop();
      return false;
    };

    for (const node of this.waitGraph.keys()) {
      if (!visited.has(node)) {
        if (dfs(node)) return path;
      }
    }
    return null;
  }
}

export class MockTransactionAdapter {
  private db: MockDatabaseAdapter;
  private isolationLevel: MockTxIsolationLevel;
  private savepointStack: TransactionSnapshot[] = [];
  private activeTxId: string | null = null;
  private static deadlockGraph = new DeadlockGraph();

  constructor(db: MockDatabaseAdapter, isolationLevel: MockTxIsolationLevel = 'READ_COMMITTED') {
    this.db = db;
    this.isolationLevel = isolationLevel;
  }

  public begin(txId: string = 'tx_' + Date.now()): string {
    this.activeTxId = txId;
    this.savepoint('__ROOT_TX__');
    return txId;
  }

  public savepoint(name: string): void {
    const stateCopy = new Map<string, any[]>();
    const tables = this.db.getAllTableNames();
    for (const table of tables) {
      const records = this.db.getRawTableData(table);
      stateCopy.set(table, JSON.parse(JSON.stringify(records)));
    }
    this.savepointStack.push({
      savepointName: name,
      stateData: stateCopy,
      timestamp: Date.now(),
    });
  }

  public rollbackToSavepoint(name: string): void {
    const idx = this.savepointStack.findIndex((s) => s.savepointName === name);
    if (idx === -1) {
      throw new Error('Savepoint not found: ' + name);
    }
    const snapshot = this.savepointStack[idx];
    for (const [table, records] of snapshot.stateData.entries()) {
      this.db.setRawTableData(table, JSON.parse(JSON.stringify(records)));
    }
    this.savepointStack = this.savepointStack.slice(0, idx + 1);
  }

  public commit(): void {
    if (this.activeTxId) {
      MockTransactionAdapter.deadlockGraph.removeTx(this.activeTxId);
    }
    this.savepointStack = [];
    this.activeTxId = null;
  }

  public rollback(): void {
    if (this.savepointStack.length > 0) {
      this.rollbackToSavepoint('__ROOT_TX__');
    }
    if (this.activeTxId) {
      MockTransactionAdapter.deadlockGraph.removeTx(this.activeTxId);
    }
    this.savepointStack = [];
    this.activeTxId = null;
  }

  public static async runInRollbackSandbox<T>(db: MockDatabaseAdapter, action: (tx: MockTransactionAdapter) => Promise<T>): Promise<T> {
    const tx = new MockTransactionAdapter(db);
    tx.begin();
    try {
      return await action(tx);
    } finally {
      tx.rollback();
    }
  }

  public static registerLockWait(waitingTx: string, holdingTx: string): void {
    this.deadlockGraph.addDependency(waitingTx, holdingTx);
    const cycle = this.deadlockGraph.detectCycle();
    if (cycle) {
      throw new Error('Deadlock detected in transaction graph: ' + cycle.join(' -> '));
    }
  }

  public static clearDeadlockGraph(): void {
    this.deadlockGraph = new DeadlockGraph();
  }
}