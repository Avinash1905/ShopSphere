export interface NegationParsedQuery {
  positiveQuery: string;
  positiveTokens: string[];
  negatedTokens: string[];
  blockedComplianceTerms: string[];
  isProhibitedQuery: boolean;
}

export class NegativeKeywordGuard {
  private static readonly PROHIBITED_TERMS = new Set([
    'counterfeit', 'replica', 'fake', 'stolen', 'exploit', 'malware', 'hack'
  ]);

  /**
   * Parses query for negative tokens (-keyword or NOT keyword) and compliance blacklist terms
   */
  public static parse(query: string): NegationParsedQuery {
    if (!query || query.trim().length === 0) {
      return {
        positiveQuery: '',
        positiveTokens: [],
        negatedTokens: [],
        blockedComplianceTerms: [],
        isProhibitedQuery: false,
      };
    }

    const tokens = query.trim().split(/\s+/);
    const positiveTokens: string[] = [];
    const negatedTokens: string[] = [];
    const blockedComplianceTerms: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const lower = token.toLowerCase();

      // Check compliance blacklist
      const cleanWord = lower.replace(/[^a-z0-9]/g, '');
      if (NegativeKeywordGuard.PROHIBITED_TERMS.has(cleanWord)) {
        blockedComplianceTerms.push(cleanWord);
        continue; // Do not add prohibited term to positiveTokens
      }

      // Check negation syntax
      if (token.startsWith('-') && token.length > 1) {
        negatedTokens.push(lower.substring(1));
      } else if (lower === 'not' && i + 1 < tokens.length) {
        negatedTokens.push(tokens[i + 1].toLowerCase());
        i++; // skip next token
      } else {
        positiveTokens.push(token);
      }
    }

    return {
      positiveQuery: positiveTokens.join(' '),
      positiveTokens,
      negatedTokens,
      blockedComplianceTerms,
      isProhibitedQuery: blockedComplianceTerms.length > 0,
    };
  }

  /**
   * Filters out candidate documents that match any of the negated tokens in text fields
   */
  public static filterNegated(
    documents: Array<{ id: string; title: string; description?: string; tags?: string[] }>,
    negatedTokens: string[]
  ): Array<{ id: string; title: string; description?: string; tags?: string[] }> {
    if (negatedTokens.length === 0) return documents;

    const lowerNegated = negatedTokens.map((t) => t.toLowerCase());

    return documents.filter((doc) => {
      const searchableText = `${doc.title} ${doc.description || ''} ${(doc.tags || []).join(' ')}`.toLowerCase();
      for (const neg of lowerNegated) {
        if (searchableText.includes(neg)) {
          return false; // Exclude document
        }
      }
      return true; // Keep document
    });
  }
}
