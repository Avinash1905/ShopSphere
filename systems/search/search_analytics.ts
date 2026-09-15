export interface SearchQueryEvent {
  query: string;
  userId?: string;
  resultCount: number;
  executionTimeMs: number;
  timestamp: string;
}

export interface SearchClickEvent {
  query: string;
  productId: string;
  positionRank: number;
  userId?: string;
  convertedToOrder: boolean;
  timestamp: string;
}

export class SearchAnalyticsService {
  private queryEvents: SearchQueryEvent[] = [];
  private clickEvents: SearchClickEvent[] = [];
  private maxLogs: number = 5000;

  public logQuery(event: SearchQueryEvent): void {
    this.queryEvents.push(event);
    if (this.queryEvents.length > this.maxLogs) {
      this.queryEvents.shift();
    }
  }

  public logClick(event: SearchClickEvent): void {
    this.clickEvents.push(event);
    if (this.clickEvents.length > this.maxLogs) {
      this.clickEvents.shift();
    }
  }

  public getZeroResultQueries(): { query: string; count: number }[] {
    const zeroMap = new Map<string, number>();
    for (const q of this.queryEvents) {
      if (q.resultCount === 0) {
        const c = zeroMap.get(q.query.toLowerCase()) || 0;
        zeroMap.set(q.query.toLowerCase(), c + 1);
      }
    }
    return Array.from(zeroMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count);
  }

  public getOverallCTR(): { totalSearches: number; totalClicks: number; ctrPercentage: number } {
    const totalSearches = this.queryEvents.length;
    const totalClicks = this.clickEvents.length;
    const ctrPercentage = totalSearches > 0 ? Math.round((totalClicks / totalSearches) * 10000) / 100 : 0;
    return {
      totalSearches,
      totalClicks,
      ctrPercentage,
    };
  }

  public getAverageExecutionLatency(): number {
    if (this.queryEvents.length === 0) return 0;
    const sum = this.queryEvents.reduce((acc, q) => acc + q.executionTimeMs, 0);
    return Math.round((sum / this.queryEvents.length) * 100) / 100;
  }
}
