export interface TermScoreBreakdown {
  term: string;
  matchedField: 'TITLE' | 'SKU' | 'BRAND' | 'DESCRIPTION' | 'TAGS';
  termFrequencyInDoc: number;
  inverseDocFrequencyIdf: number;
  fieldWeightMultiplier: number;
  bm25TermScore: number;
}

export interface SearchScoreExplanation {
  documentId: string;
  documentTitle: string;
  totalCompositeScore: number;
  baseLexicalScore: number;
  termBreakdowns: TermScoreBreakdown[];
  fieldBoostContributions: Record<string, number>;
  businessFactorMultipliers: {
    ratingBoost: number;
    salesPopularityBoost: number;
    recencyBoost: number;
    inStockMultiplier: number;
  };
  explanationNarrative: string;
}

export class ExplainableSearchDebugger {
  /**
   * Generates a complete mathematical and narrative breakdown for a scored search result
   */
  public static explain(
    docId: string,
    title: string,
    terms: string[],
    docData: {
      rating?: number;
      salesCount?: number;
      inStock?: boolean;
      publishedAt?: string;
    } = {}
  ): SearchScoreExplanation {
    const termBreakdowns: TermScoreBreakdown[] = [];
    let lexicalSum = 0;
    const fieldBoosts: Record<string, number> = { TITLE: 0, BRAND: 0, DESCRIPTION: 0 };

    const lowerTitle = title.toLowerCase();

    for (const term of terms) {
      const lowerTerm = term.toLowerCase();
      let matchedField: TermScoreBreakdown['matchedField'] = 'DESCRIPTION';
      let fieldWeight = 1.0;
      let tf = 0;

      if (lowerTitle.includes(lowerTerm)) {
        matchedField = 'TITLE';
        fieldWeight = 4.0;
        tf = (lowerTitle.match(new RegExp(lowerTerm, 'g')) || []).length;
      } else {
        tf = 1;
      }

      const idf = 1.5 + Math.log(100 / (tf + 5));
      const score = Math.round(tf * idf * fieldWeight * 100) / 100;
      lexicalSum += score;
      fieldBoosts[matchedField] = (fieldBoosts[matchedField] || 0) + score;

      termBreakdowns.push({
        term,
        matchedField,
        termFrequencyInDoc: tf,
        inverseDocFrequencyIdf: Math.round(idf * 100) / 100,
        fieldWeightMultiplier: fieldWeight,
        bm25TermScore: score,
      });
    }

    const ratingBoost = docData.rating ? Math.round((docData.rating / 5.0) * 0.2 * 100) / 100 : 0.05;
    const salesBoost = docData.salesCount ? Math.min(0.25, Math.round(Math.log10(docData.salesCount + 1) * 0.08 * 100) / 100) : 0.02;
    const recencyBoost = 0.05;
    const inStockMultiplier = docData.inStock === false ? 0.5 : 1.0;

    const totalMultiplier = (1.0 + ratingBoost + salesBoost + recencyBoost) * inStockMultiplier;
    const finalScore = Math.round(lexicalSum * totalMultiplier * 100) / 100;

    const narrative = `Doc '${title}' achieved composite score ${finalScore}. Lexical BM25 yielded ${lexicalSum} points across ${terms.length} terms (Title match contribution: ${fieldBoosts.TITLE}). Business adjustments applied +${Math.round((ratingBoost + salesBoost + recencyBoost) * 100)}% boost with stock multiplier ${inStockMultiplier}x.`;

    return {
      documentId: docId,
      documentTitle: title,
      totalCompositeScore: finalScore,
      baseLexicalScore: lexicalSum,
      termBreakdowns,
      fieldBoostContributions: fieldBoosts,
      businessFactorMultipliers: {
        ratingBoost,
        salesPopularityBoost: salesBoost,
        recencyBoost,
        inStockMultiplier,
      },
      explanationNarrative: narrative,
    };
  }
}
