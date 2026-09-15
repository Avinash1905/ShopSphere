/**
 * ShopSphere Analytics Engine - Multi-Dimensional OLAP Cube & Rollup Engine
 * Supports:
 * - Dimensions: Time (Year, Month, Day), Category, Region, Seller
 * - Measures: TotalRevenue, OrderCount, UnitsSold, AvgOrderValue
 * - Operations: Slice, Dice, Rollup, Drill-Down
 */

export interface OLAPTransactionFact {
  year: number;
  month: number;
  category: string;
  region: string;
  sellerId: string;
  revenue: number;
  units: number;
}

export interface OLAPCellAggregate {
  revenue: number;
  units: number;
  orderCount: number;
  avgOrderValue: number;
}

export class OLAPCubeEngine {
  private facts: OLAPTransactionFact[] = [];

  public loadFacts(facts: OLAPTransactionFact[]): void {
    this.facts = facts;
  }

  /**
   * Slice: Filters cube along a single dimension (e.g. category = 'Electronics')
   */
  public slice(dimension: keyof OLAPTransactionFact, value: any): OLAPCubeEngine {
    const subCube = new OLAPCubeEngine();
    subCube.loadFacts(this.facts.filter((f) => f[dimension] === value));
    return subCube;
  }

  /**
   * Dice: Filters cube along multiple dimension criteria
   */
  public dice(predicate: (fact: OLAPTransactionFact) => boolean): OLAPCubeEngine {
    const subCube = new OLAPCubeEngine();
    subCube.loadFacts(this.facts.filter(predicate));
    return subCube;
  }

  /**
   * Rollup: Aggregates facts grouped by specified dimensions
   */
  public rollup(groupByDimensions: Array<keyof OLAPTransactionFact>): Map<string, OLAPCellAggregate> {
    const aggregates = new Map<string, { revenue: number; units: number; count: number }>();

    for (const fact of this.facts) {
      const keyParts = groupByDimensions.map((dim) => String(fact[dim]));
      const groupKey = keyParts.join(' | ');

      if (!aggregates.has(groupKey)) {
        aggregates.set(groupKey, { revenue: 0, units: 0, count: 0 });
      }

      const cell = aggregates.get(groupKey)!;
      cell.revenue += fact.revenue;
      cell.units += fact.units;
      cell.count += 1;
    }

    const result = new Map<string, OLAPCellAggregate>();
    for (const [key, cell] of aggregates) {
      result.set(key, {
        revenue: Math.round(cell.revenue * 100) / 100,
        units: cell.units,
        orderCount: cell.count,
        avgOrderValue: cell.count > 0 ? Math.round((cell.revenue / cell.count) * 100) / 100 : 0,
      });
    }

    return result;
  }
}
