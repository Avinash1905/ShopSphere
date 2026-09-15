/**
 * ShopSphere Search Engine - High-Performance SymSpell Spell Corrector
 * Features:
 * - Statistical language model with frequency-weighted dictionary
 * - Deletion-based sub-millisecond edit distance lookup ($O(1)$)
 * - Automatic "Did You Mean" query suggestions
 */

import { FuzzyMatcher } from './fuzzy_matcher.js';

export interface CorrectionCandidate {
  word: string;
  distance: number;
  frequency: number;
  score: number;
}

export class SpellCorrector {
  private static dictionary: Map<string, number> = new Map();
  private static deletionIndex: Map<string, Set<string>> = new Map();

  static {
    this.trainDefaultVocabulary();
  }

  public static trainDefaultVocabulary(): void {
    const vocab = [
      ['apple', 1000],
      ['iphone', 950],
      ['samsung', 900],
      ['wireless', 850],
      ['headphones', 800],
      ['earphones', 750],
      ['bluetooth', 700],
      ['laptop', 650],
      ['keyboard', 600],
      ['gaming', 550],
      ['monitor', 500],
      ['sneakers', 450],
      ['backpack', 400],
      ['running', 350],
      ['shoes', 300],
      ['smartwatch', 250],
      ['camera', 200],
      ['tablet', 150],
    ];

    for (const [word, freq] of vocab) {
      this.addWord(word as string, freq as number);
    }
  }

  public static addWord(word: string, frequency: number = 1): void {
    const lower = word.toLowerCase();
    this.dictionary.set(lower, (this.dictionary.get(lower) || 0) + frequency);

    // Index deletes up to distance 2
    const deletes = this.getDeletions(lower, 2);
    for (const del of deletes) {
      if (!this.deletionIndex.has(del)) {
        this.deletionIndex.set(del, new Set());
      }
      this.deletionIndex.get(del)!.add(lower);
    }
  }

  private static getDeletions(word: string, maxDistance: number): Set<string> {
    const results = new Set<string>();
    results.add(word);

    let currentLevel = new Set<string>([word]);
    for (let d = 1; d <= maxDistance; d++) {
      const nextLevel = new Set<string>();
      for (const w of currentLevel) {
        if (w.length > 1) {
          for (let i = 0; i < w.length; i++) {
            const del = w.slice(0, i) + w.slice(i + 1);
            if (!results.has(del)) {
              results.add(del);
              nextLevel.add(del);
            }
          }
        }
      }
      currentLevel = nextLevel;
    }

    return results;
  }

  /**
   * Corrects a single misspelled word
   */
  public static correctWord(inputWord: string, maxEditDistance: number = 2): CorrectionCandidate[] {
    const lower = inputWord.toLowerCase();

    // Exact match in dictionary
    if (this.dictionary.has(lower)) {
      return [{
        word: lower,
        distance: 0,
        frequency: this.dictionary.get(lower)!,
        score: 1.0,
      }];
    }

    const candidates = new Map<string, CorrectionCandidate>();
    const queryDeletes = this.getDeletions(lower, maxEditDistance);

    for (const del of queryDeletes) {
      const matchingWords = this.deletionIndex.get(del);
      if (matchingWords) {
        for (const candidateWord of matchingWords) {
          const dist = FuzzyMatcher.levenshteinDistance(lower, candidateWord);
          if (dist <= maxEditDistance) {
            const freq = this.dictionary.get(candidateWord) || 1;
            const score = (1 / (dist + 1)) * Math.log10(freq + 10);
            if (!candidates.has(candidateWord) || candidates.get(candidateWord)!.score < score) {
              candidates.set(candidateWord, { word: candidateWord, distance: dist, frequency: freq, score });
            }
          }
        }
      }
    }

    return Array.from(candidates.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Generates a "Did You Mean" phrase suggestion
   */
  public static didYouMean(query: string): string | null {
    const words = query.trim().split(/\s+/);
    let hasCorrection = false;
    const correctedWords: string[] = [];

    for (const word of words) {
      const suggestions = this.correctWord(word, 2);
      if (suggestions.length > 0 && suggestions[0].word !== word.toLowerCase()) {
        correctedWords.push(suggestions[0].word);
        hasCorrection = true;
      } else {
        correctedWords.push(word);
      }
    }

    return hasCorrection ? correctedWords.join(' ') : null;
  }
}
