/**
 * ShopSphere Search Engine - Compound Boolean & Proximity Search Parser
 * Features:
 * - Boolean expressions: term1 AND term2, term1 OR term2, term1 NOT term2
 * - Exact phrase quotes: "noise cancelling"
 * - Word proximity slop: "apple watch"~3 (words occur within distance 3)
 * - AST evaluation against document token postings
 */

export type BooleanNodeType = 'TERM' | 'PHRASE' | 'PROXIMITY' | 'AND' | 'OR' | 'NOT';

export interface BooleanASTNode {
  type: BooleanNodeType;
  value?: string;
  terms?: string[];
  slop?: number;
  left?: BooleanASTNode;
  right?: BooleanASTNode;
}

export class BooleanProximityParser {
  /**
   * Parses raw query string into an AST
   */
  public static parse(query: string): BooleanASTNode {
    const trimmed = query.trim();
    if (!trimmed) {
      return { type: 'TERM', value: '' };
    }

    // Check for proximity quote with slop: "term1 term2"~N
    const proxMatch = trimmed.match(/^"([^"]+)"~(\d+)$/);
    if (proxMatch) {
      const terms = proxMatch[1].toLowerCase().split(/\s+/);
      const slop = parseInt(proxMatch[2], 10);
      return { type: 'PROXIMITY', terms, slop };
    }

    // Check for exact phrase quote: "term1 term2"
    const phraseMatch = trimmed.match(/^"([^"]+)"$/);
    if (phraseMatch) {
      const terms = phraseMatch[1].toLowerCase().split(/\s+/);
      return { type: 'PHRASE', terms };
    }

    // Check for AND
    if (trimmed.includes(' AND ')) {
      const parts = trimmed.split(' AND ');
      return {
        type: 'AND',
        left: this.parse(parts[0]),
        right: this.parse(parts.slice(1).join(' AND ')),
      };
    }

    // Check for OR
    if (trimmed.includes(' OR ')) {
      const parts = trimmed.split(' OR ');
      return {
        type: 'OR',
        left: this.parse(parts[0]),
        right: this.parse(parts.slice(1).join(' OR ')),
      };
    }

    // Check for NOT
    if (trimmed.startsWith('NOT ')) {
      return {
        type: 'NOT',
        right: this.parse(trimmed.substring(4)),
      };
    }

    // Single term
    return {
      type: 'TERM',
      value: trimmed.toLowerCase(),
    };
  }

  /**
   * Evaluates Boolean AST against document token positions
   */
  public static evaluate(
    node: BooleanASTNode,
    docTokenPositions: Map<string, number[]> // word -> array of position indices
  ): boolean {
    switch (node.type) {
      case 'TERM':
        if (!node.value) return true;
        return docTokenPositions.has(node.value);

      case 'PHRASE':
        if (!node.terms || node.terms.length === 0) return true;
        return this.matchesPhrase(node.terms, docTokenPositions, 1);

      case 'PROXIMITY':
        if (!node.terms || node.terms.length === 0) return true;
        return this.matchesPhrase(node.terms, docTokenPositions, node.slop || 2);

      case 'AND':
        return (
          !!node.left &&
          !!node.right &&
          this.evaluate(node.left, docTokenPositions) &&
          this.evaluate(node.right, docTokenPositions)
        );

      case 'OR':
        return (
          (!!node.left && this.evaluate(node.left, docTokenPositions)) ||
          (!!node.right && this.evaluate(node.right, docTokenPositions))
        );

      case 'NOT':
        return !node.right || !this.evaluate(node.right, docTokenPositions);
    }
  }

  private static matchesPhrase(
    phraseTerms: string[],
    docTokenPositions: Map<string, number[]>,
    maxSlop: number
  ): boolean {
    for (const term of phraseTerms) {
      if (!docTokenPositions.has(term)) return false;
    }

    const pos0 = docTokenPositions.get(phraseTerms[0])!;
    const pos1 = docTokenPositions.get(phraseTerms[1])!;

    for (const p0 of pos0) {
      for (const p1 of pos1) {
        const diff = p1 - p0;
        if (diff > 0 && diff <= maxSlop) {
          return true;
        }
      }
    }

    return false;
  }
}
