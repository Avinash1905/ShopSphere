export interface AutocompleteTrieNode {
  char: string;
  isEndOfWord: boolean;
  frequency: number;
  phrase?: string;
  metadata?: Record<string, any>;
  children: Map<string, AutocompleteTrieNode>;
}

export interface AutocompleteSuggestion {
  phrase: string;
  frequency: number;
  score: number;
  highlighted: string;
  type: 'EXACT_PREFIX' | 'FUZZY_MATCH' | 'TRENDING';
  metadata?: Record<string, any>;
}

export class AutocompleteTrieEngine {
  private root: AutocompleteTrieNode;
  private totalPhrases: number = 0;

  constructor() {
    this.root = this.createNode('');
  }

  private createNode(char: string): AutocompleteTrieNode {
    return {
      char,
      isEndOfWord: false,
      frequency: 0,
      children: new Map(),
    };
  }

  public insert(phrase: string, frequency: number = 1, metadata?: Record<string, any>): void {
    if (!phrase || phrase.trim().length === 0) return;
    const normalized = phrase.trim().toLowerCase();

    let curr = this.root;
    for (let i = 0; i < normalized.length; i++) {
      const ch = normalized[i];
      if (!curr.children.has(ch)) {
        curr.children.set(ch, this.createNode(ch));
      }
      curr = curr.children.get(ch)!;
    }

    if (!curr.isEndOfWord) {
      this.totalPhrases++;
    }
    curr.isEndOfWord = true;
    curr.frequency += frequency;
    curr.phrase = normalized;
    if (metadata) {
      curr.metadata = { ...(curr.metadata || {}), ...metadata };
    }
  }

  public suggest(prefix: string, maxResults: number = 10): AutocompleteSuggestion[] {
    if (!prefix || prefix.trim().length === 0) return [];
    const normalized = prefix.trim().toLowerCase();

    let curr = this.root;
    for (let i = 0; i < normalized.length; i++) {
      const ch = normalized[i];
      if (!curr.children.has(ch)) {
        return this.fuzzySuggest(normalized, maxResults);
      }
      curr = curr.children.get(ch)!;
    }

    const collected: AutocompleteSuggestion[] = [];
    this.dfsCollect(curr, normalized, collected);
    collected.sort((a, b) => b.frequency - a.frequency);
    return collected.slice(0, maxResults);
  }

  private dfsCollect(node: AutocompleteTrieNode, prefix: string, results: AutocompleteSuggestion[]): void {
    if (node.isEndOfWord && node.phrase) {
      const highlight = `<b>${prefix}</b>${node.phrase.substring(prefix.length)}`;
      results.push({
        phrase: node.phrase,
        frequency: node.frequency,
        score: Math.log(node.frequency + 1) * 10,
        highlighted: highlight,
        type: 'EXACT_PREFIX',
        metadata: node.metadata,
      });
    }

    for (const child of node.children.values()) {
      this.dfsCollect(child, prefix, results);
    }
  }

  public fuzzySuggest(prefix: string, maxResults: number = 5): AutocompleteSuggestion[] {
    const candidates: AutocompleteSuggestion[] = [];
    const allPhrases: Array<{ phrase: string; freq: number; meta?: Record<string, any> }> = [];

    const collectAll = (n: AutocompleteTrieNode) => {
      if (n.isEndOfWord && n.phrase) {
        allPhrases.push({ phrase: n.phrase, freq: n.frequency, meta: n.metadata });
      }
      for (const c of n.children.values()) {
        collectAll(c);
      }
    };
    collectAll(this.root);

    for (const item of allPhrases) {
      const firstWord = item.phrase.split(' ')[0];
      const dist = this.calculateLevenshteinDistance(prefix, firstWord);
      if (dist <= 2 || this.calculateLevenshteinDistance(prefix, item.phrase.substring(0, Math.min(item.phrase.length, prefix.length + 1))) <= 2) {
        candidates.push({
          phrase: item.phrase,
          frequency: item.freq,
          score: Math.log(item.freq + 1) * 5,
          highlighted: item.phrase,
          type: 'FUZZY_MATCH',
          metadata: item.meta,
        });
      }
    }

    candidates.sort((a, b) => b.frequency - a.frequency);
    return candidates.slice(0, maxResults);
  }

  private calculateLevenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  }

  public size(): number {
    return this.totalPhrases;
  }

  public clear(): void {
    this.root = this.createNode('');
    this.totalPhrases = 0;
  }
}
