import { InvertedIndex, IndexedDocument } from './exact_matcher.js';
import { FuzzyMatcher } from './fuzzy_matcher.js';

export interface FieldBoostWeights {
  title: number;
  sku: number;
  brand: number;
  category: number;
  tags: number;
  description: number;
}

export interface DynamicBoostConfig {
  ratingWeight: number;
  popularityWeight: number;
  featuredMultiplier: number;
  inStockMultiplier: number;
}

export const DEFAULT_FIELD_WEIGHTS: FieldBoostWeights = {
  title: 3.5,
  sku: 4.0,
  brand: 2.5,
  category: 2.0,
  tags: 2.0,
  description: 1.0,
};

export const DEFAULT_DYNAMIC_BOOST: DynamicBoostConfig = {
  ratingWeight: 0.25, // (rating / 5.0) * 0.25
  popularityWeight: 0.15, // log(sales + 1) * 0.15
  featuredMultiplier: 1.2,
  inStockMultiplier: 1.15,
};

export interface ScoredSearchResult {
  docId: string;
  document: IndexedDocument;
  score: number;
  bm25Score: number;
  fuzzyScore: number;
  dynamicBoost: number;
  matchedFields: string[];
}

export class RankingEngine {
  private index: InvertedIndex;
  private fieldWeights: FieldBoostWeights;
  private dynamicBoost: DynamicBoostConfig;

  // BM25 parameters
  private readonly k1: number = 1.2;
  private readonly b: number = 0.75;

  constructor(
    index: InvertedIndex,
    fieldWeights: FieldBoostWeights = DEFAULT_FIELD_WEIGHTS,
    dynamicBoost: DynamicBoostConfig = DEFAULT_DYNAMIC_BOOST
  ) {
    this.index = index;
    this.fieldWeights = fieldWeights;
    this.dynamicBoost = dynamicBoost;
  }

  public scoreQuery(queryTerms: string[], phrases: string[] = []): ScoredSearchResult[] {
    const totalDocs = this.index.getTotalDocuments();
    if (totalDocs === 0 || (queryTerms.length === 0 && phrases.length === 0)) {
      // If no query terms, return all docs with dynamic base scores
      return this.index.getAllDocuments().map((doc) => this.buildScoredResult(doc, 0, 0, 1.0, []));
    }

    const docScores: Map<string, { bm25: number; fuzzy: number; matchedFields: Set<string> }> = new Map();

    for (const term of queryTerms) {
      const postings = this.index.getPostings(term);
      const docFreq = postings ? postings.size : 0;

      // BM25 IDF: log(1 + (N - n + 0.5) / (n + 0.5))
      const idf = Math.log(1 + (totalDocs - docFreq + 0.5) / (docFreq + 0.5));

      if (postings) {
        for (const [docId, posting] of postings.entries()) {
          const doc = this.index.getDocument(docId);
          if (!doc) continue;

          const fieldWeight = (this.fieldWeights as any)[posting.field] || 1.0;
          const fieldLen = doc.fieldLengths[posting.field] || 1;
          const avgFieldLen = this.index.getAverageFieldLength(posting.field) || 1;

          // BM25 Term Frequency component
          const tf = posting.frequency;
          const tfScore = (tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + this.b * (fieldLen / avgFieldLen)));
          const termScore = idf * tfScore * fieldWeight;

          let entry = docScores.get(docId);
          if (!entry) {
            entry = { bm25: 0, fuzzy: 0, matchedFields: new Set() };
            docScores.set(docId, entry);
          }
          entry.bm25 += termScore;
          entry.matchedFields.add(posting.field);
        }
      } else {
        // Fallback: Word-level fuzzy matching across document fields
        for (const doc of this.index.getAllDocuments()) {
          for (const [field, text] of Object.entries(doc.fields)) {
            const words = text.toLowerCase().split(/\s+/).filter(Boolean);
            let bestWordSim = 0;
            for (const word of words) {
              const lev = FuzzyMatcher.levenshtein(term, word);
              const maxLen = Math.max(term.length, word.length);
              if (lev <= 2 && maxLen >= 4) {
                const levSim = 1 - lev / maxLen;
                if (levSim > bestWordSim) bestWordSim = levSim;
              }
              const triSim = FuzzyMatcher.trigramSimilarity(term, word);
              if (triSim > bestWordSim) bestWordSim = triSim;
              const jaroSim = FuzzyMatcher.jaroWinkler(term, word);
              if (jaroSim > bestWordSim) bestWordSim = jaroSim;
            }

            if (bestWordSim >= 0.65) {
              const weight = (this.fieldWeights as any)[field] || 1.0;
              let entry = docScores.get(doc.id);
              if (!entry) {
                entry = { bm25: 0, fuzzy: 0, matchedFields: new Set() };
                docScores.set(doc.id, entry);
              }
              entry.fuzzy += bestWordSim * weight * 2.0;
              entry.matchedFields.add(field);
            }
          }
        }
      }
    }

    // Exact phrase match boost
    for (const phrase of phrases) {
      const matchedDocIds = this.index.exactPhraseMatch(phrase);
      for (const docId of matchedDocIds) {
        let entry = docScores.get(docId);
        if (!entry) {
          entry = { bm25: 0, fuzzy: 0, matchedFields: new Set() };
          docScores.set(docId, entry);
        }
        entry.bm25 += 10.0; // Substantial phrase boost
        entry.matchedFields.add('phrase_match');
      }
    }

    // Calculate final combined scores with dynamic business multipliers
    const results: ScoredSearchResult[] = [];

    for (const [docId, scoreData] of docScores.entries()) {
      const doc = this.index.getDocument(docId);
      if (!doc) continue;

      const dynamicBoost = this.calculateDynamicBoost(doc);
      const totalScore = (scoreData.bm25 + scoreData.fuzzy) * dynamicBoost;

      results.push({
        docId,
        document: doc,
        score: Math.round(totalScore * 1000) / 1000,
        bm25Score: Math.round(scoreData.bm25 * 1000) / 1000,
        fuzzyScore: Math.round(scoreData.fuzzy * 1000) / 1000,
        dynamicBoost: Math.round(dynamicBoost * 1000) / 1000,
        matchedFields: Array.from(scoreData.matchedFields),
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private calculateDynamicBoost(doc: IndexedDocument): number {
    let multiplier = 1.0;

    const rating = Number(doc.attributes.rating_average || 0);
    if (rating > 0) {
      multiplier += (rating / 5.0) * this.dynamicBoost.ratingWeight;
    }

    const sales = Number(doc.attributes.total_sales_count || 0);
    if (sales > 0) {
      multiplier += Math.log10(sales + 1) * this.dynamicBoost.popularityWeight;
    }

    if (doc.attributes.is_featured) {
      multiplier *= this.dynamicBoost.featuredMultiplier;
    }

    if (doc.attributes.in_stock !== false) {
      multiplier *= this.dynamicBoost.inStockMultiplier;
    }

    return multiplier;
  }

  private buildScoredResult(
    doc: IndexedDocument,
    bm25: number,
    fuzzy: number,
    boost: number,
    matchedFields: string[]
  ): ScoredSearchResult {
    const dynamicBoost = this.calculateDynamicBoost(doc);
    return {
      docId: doc.id,
      document: doc,
      score: dynamicBoost,
      bm25Score: bm25,
      fuzzyScore: fuzzy,
      dynamicBoost,
      matchedFields,
    };
  }
}
