import { PrefixTrie, FuzzyMatcher } from './fuzzy_matcher.js';
import { SearchNormalizer } from './normalizer.js';

export interface SearchSuggestionItem {
  text: string;
  type: 'PREFIX' | 'DID_YOU_MEAN' | 'POPULAR_QUERY';
  score: number;
  highlighted: string;
}

export class SearchSuggestionService {
  private trie: PrefixTrie;
  private vocabulary: Set<string> = new Set();
  private popularQueries: Map<string, number> = new Map();

  constructor() {
    this.trie = new PrefixTrie();
  }

  public indexTerms(terms: string[], weight: number = 1): void {
    for (const raw of terms) {
      const normalized = SearchNormalizer.normalize(raw);
      if (normalized.length >= 2) {
        this.trie.insert(normalized, weight);
        this.vocabulary.add(normalized);

        const words = normalized.split(/\s+/).filter((w) => w.length >= 2);
        for (const w of words) {
          this.trie.insert(w, weight);
          this.vocabulary.add(w);
        }
      }
    }
  }

  public recordPopularQuery(query: string): void {
    const clean = SearchNormalizer.normalize(query);
    if (!clean) return;
    const current = this.popularQueries.get(clean) || 0;
    this.popularQueries.set(clean, current + 1);
    this.trie.insert(clean, 5);
  }

  public getSuggestions(query: string, limit: number = 8): SearchSuggestionItem[] {
    const clean = SearchNormalizer.normalize(query);
    if (!clean || clean.length === 0) return [];

    const suggestions: SearchSuggestionItem[] = [];
    const seen = new Set<string>();

    // 1. Exact Prefix matches from Trie
    const prefixMatches = this.trie.searchPrefix(clean, limit);
    for (const pm of prefixMatches) {
      if (!seen.has(pm.word)) {
        seen.add(pm.word);
        suggestions.push({
          text: pm.word,
          type: 'PREFIX',
          score: 1.0 + pm.frequency * 0.1,
          highlighted: this.highlightPrefix(pm.word, clean),
        });
      }
    }

    // 2. Fuzzy "Did You Mean?" if few prefix matches found
    if (suggestions.length < 3) {
      for (const vocabWord of this.vocabulary) {
        if (seen.has(vocabWord)) continue;
        const dist = FuzzyMatcher.levenshtein(clean, vocabWord);
        if (dist > 0 && dist <= 2) {
          const score = 1.0 / (dist + 1);
          seen.add(vocabWord);
          suggestions.push({
            text: vocabWord,
            type: 'DID_YOU_MEAN',
            score,
            highlighted: vocabWord,
          });
          if (suggestions.length >= limit) break;
        }
      }
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private highlightPrefix(fullText: string, prefix: string): string {
    if (fullText.startsWith(prefix)) {
      return `<b>${fullText.substring(0, prefix.length)}</b>${fullText.substring(prefix.length)}`;
    }
    return fullText;
  }
}
