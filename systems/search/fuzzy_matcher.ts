export interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  frequency: number;
  word?: string;
}

export class PrefixTrie {
  private root: TrieNode;

  constructor() {
    this.root = { children: new Map(), isEndOfWord: false, frequency: 0 };
  }

  public insert(word: string, frequency: number = 1): void {
    let current = this.root;
    const clean = word.toLowerCase().trim();

    for (const char of clean) {
      let child = current.children.get(char);
      if (!child) {
        child = { children: new Map(), isEndOfWord: false, frequency: 0 };
        current.children.set(char, child);
      }
      current = child;
    }

    current.isEndOfWord = true;
    current.word = clean;
    current.frequency += frequency;
  }

  public searchPrefix(prefix: string, maxResults: number = 10): { word: string; frequency: number }[] {
    let current = this.root;
    const clean = prefix.toLowerCase().trim();

    for (const char of clean) {
      const child = current.children.get(char);
      if (!child) return [];
      current = child;
    }

    const results: { word: string; frequency: number }[] = [];
    this.collectWords(current, results);
    return results.sort((a, b) => b.frequency - a.frequency).slice(0, maxResults);
  }

  private collectWords(node: TrieNode, results: { word: string; frequency: number }[]): void {
    if (node.isEndOfWord && node.word) {
      results.push({ word: node.word, frequency: node.frequency });
    }
    for (const child of node.children.values()) {
      this.collectWords(child, results);
    }
  }
}

export class FuzzyMatcher {
  /**
   * Levenshtein edit distance with dynamic programming
   */
  public static levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    const s1 = a.toLowerCase();
    const s2 = b.toLowerCase();

    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[s1.length][s2.length];
  }

  public static levenshteinDistance(a: string, b: string): number {
    return this.levenshtein(a, b);
  }

  /**
   * Damerau-Levenshtein distance accounting for adjacent transpositions
   */
  public static damerauLevenshtein(a: string, b: string): number {
    const s1 = a.toLowerCase();
    const s2 = b.toLowerCase();
    const d: number[][] = [];

    for (let i = 0; i <= s1.length; i++) {
      d[i] = [];
      d[i][0] = i;
    }
    for (let j = 0; j <= s2.length; j++) {
      d[0][j] = j;
    }

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);

        if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // transposition
        }
      }
    }

    return d[s1.length][s2.length];
  }

  /**
   * Trigram Jaccard similarity score (0.0 to 1.0)
   */
  public static trigramSimilarity(a: string, b: string): number {
    const getTrigrams = (str: string): Set<string> => {
      const set = new Set<string>();
      const s = str.toLowerCase().trim();
      if (s.length < 3) {
        set.add(s);
        return set;
      }
      for (let i = 0; i <= s.length - 3; i++) {
        set.add(s.substring(i, i + 3));
      }
      return set;
    };

    const triA = getTrigrams(a);
    const triB = getTrigrams(b);

    let intersection = 0;
    for (const t of triA) {
      if (triB.has(t)) intersection++;
    }

    const union = triA.size + triB.size - intersection;
    return union === 0 ? 1.0 : intersection / union;
  }

  /**
   * Jaro-Winkler string similarity (0.0 to 1.0)
   */
  public static jaroWinkler(s1: string, s2: string): number {
    const str1 = s1.toLowerCase();
    const str2 = s2.toLowerCase();
    if (str1 === str2) return 1.0;

    const len1 = str1.length;
    const len2 = str2.length;
    if (len1 === 0 || len2 === 0) return 0.0;

    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);

    let matches = 0;
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, len2);
      for (let j = start; j < end; j++) {
        if (s2Matches[j] || str1[i] !== str2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;

    // Winkler prefix boost
    let prefix = 0;
    for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
      if (str1[i] === str2[i]) prefix++;
      else break;
    }

    return jaro + prefix * 0.1 * (1 - jaro);
  }
}
