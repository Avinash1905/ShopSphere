import { MetricsCalculator } from './metrics_calculator.js';

export interface AggregateGroup<T> {
  key: string;
  count: number;
  items: T[];
  sumField(field: keyof T): number;
  avgField(field: keyof T): number;
  minField(field: keyof T): number;
  maxField(field: keyof T): number;
}

export class AggregationEngine {
  public static groupBy<T>(items: T[], keySelector: (item: T) => string): Map<string, AggregateGroup<T>> {
    const groups = new Map<string, AggregateGroup<T>>();

    for (const item of items) {
      const key = keySelector(item);
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          count: 0,
          items: [],
          sumField(field: keyof T): number {
            return MetricsCalculator.sum(this.items.map((i) => Number(i[field]) || 0));
          },
          avgField(field: keyof T): number {
            return MetricsCalculator.mean(this.items.map((i) => Number(i[field]) || 0));
          },
          minField(field: keyof T): number {
            const vals = this.items.map((i) => Number(i[field]) || 0);
            return vals.length > 0 ? Math.min(...vals) : 0;
          },
          maxField(field: keyof T): number {
            const vals = this.items.map((i) => Number(i[field]) || 0);
            return vals.length > 0 ? Math.max(...vals) : 0;
          },
        };
        groups.set(key, group);
      }
      group.items.push(item);
      group.count++;
    }

    return groups;
  }

  public static pivot<T>(
    items: T[],
    rowKeySelector: (item: T) => string,
    colKeySelector: (item: T) => string,
    valueAggregator: (cellItems: T[]) => number
  ): { rowKeys: string[]; colKeys: string[]; matrix: Record<string, Record<string, number>> } {
    const rowKeySet = new Set<string>();
    const colKeySet = new Set<string>();
    const cellBuckets = new Map<string, T[]>();

    for (const item of items) {
      const row = rowKeySelector(item);
      const col = colKeySelector(item);
      rowKeySet.add(row);
      colKeySet.add(col);

      const cellKey = `${row}:::${col}`;
      let list = cellBuckets.get(cellKey);
      if (!list) {
        list = [];
        cellBuckets.set(cellKey, list);
      }
      list.push(item);
    }

    const rowKeys = Array.from(rowKeySet).sort();
    const colKeys = Array.from(colKeySet).sort();
    const matrix: Record<string, Record<string, number>> = {};

    for (const r of rowKeys) {
      matrix[r] = {};
      for (const c of colKeys) {
        const cellItems = cellBuckets.get(`${r}:::${c}`) || [];
        matrix[r][c] = valueAggregator(cellItems);
      }
    }

    return { rowKeys, colKeys, matrix };
  }
}
