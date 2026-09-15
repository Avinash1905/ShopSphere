export interface SearchHistoryEntry {
  userId: string;
  query: string;
  timestamp: string;
  resultCount: number;
}

export class SearchHistoryTracker {
  // userId -> history entries
  private userHistory: Map<string, SearchHistoryEntry[]> = new Map();
  private globalTrending: Map<string, { count: number; lastSearched: number }> = new Map();
  private maxHistoryPerUser: number = 20;

  public recordSearch(userId: string | undefined, query: string, resultCount: number): void {
    const clean = query.trim();
    if (!clean) return;

    const now = Date.now();
    const isoNow = new Date(now).toISOString();

    // 1. Record in global trending
    const trending = this.globalTrending.get(clean.toLowerCase()) || { count: 0, lastSearched: now };
    trending.count++;
    trending.lastSearched = now;
    this.globalTrending.set(clean.toLowerCase(), trending);

    // 2. Record in user history if authenticated
    if (userId) {
      let list = this.userHistory.get(userId);
      if (!list) {
        list = [];
        this.userHistory.set(userId, list);
      }

      // Deduplicate recent identical queries
      const existingIdx = list.findIndex((e) => e.query.toLowerCase() === clean.toLowerCase());
      if (existingIdx !== -1) {
        list.splice(existingIdx, 1);
      }

      list.unshift({
        userId,
        query: clean,
        timestamp: isoNow,
        resultCount,
      });

      if (list.length > this.maxHistoryPerUser) {
        list.pop();
      }
    }
  }

  public getUserHistory(userId: string, limit: number = 10): SearchHistoryEntry[] {
    const list = this.userHistory.get(userId) || [];
    return list.slice(0, limit);
  }

  public clearUserHistory(userId: string): void {
    this.userHistory.delete(userId);
  }

  public getTrendingQueries(limit: number = 10): { query: string; count: number }[] {
    const entries = Array.from(this.globalTrending.entries()).map(([query, data]) => ({
      query,
      count: data.count,
      lastSearched: data.lastSearched,
    }));

    return entries
      .sort((a, b) => b.count - a.count || b.lastSearched - a.lastSearched)
      .slice(0, limit)
      .map(({ query, count }) => ({ query, count }));
  }
}
