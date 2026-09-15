/**
 * ShopSphere Search Engine - Synonym & Query Expansion Engine
 */

export interface SynonymRule {
  terms: string[];
  isBidirectional: boolean;
  weight: number;
}

export class SynonymExpansionEngine {
  private static synonymMap: Map<string, Array<{ term: string; weight: number }>> = new Map();

  static {
    this.registerDefaultSynonyms();
  }

  public static registerDefaultSynonyms(): void {
    const defaultGroups: SynonymRule[] = [
      { terms: ['phone', 'mobile', 'cellphone', 'smartphone', 'phones', 'mobiles', 'smartphones'], isBidirectional: true, weight: 0.9 },
      { terms: ['laptop', 'notebook', 'ultrabook', 'computer', 'laptops', 'notebooks'], isBidirectional: true, weight: 0.85 },
      { terms: ['headphone', 'earphone', 'headset', 'earbuds', 'anc', 'headphones', 'earphones'], isBidirectional: true, weight: 0.9 },
      { terms: ['tv', 'television', 'monitor', 'display', 'displays', 'monitors'], isBidirectional: true, weight: 0.8 },
      { terms: ['shoes', 'sneakers', 'footwear', 'kicks', 'trainers', 'shoe'], isBidirectional: true, weight: 0.9 },
      { terms: ['bag', 'backpack', 'rucksack', 'knapsack', 'bags', 'backpacks'], isBidirectional: true, weight: 0.85 },
      { terms: ['jacket', 'coat', 'outerwear', 'parka', 'jackets', 'coats'], isBidirectional: true, weight: 0.85 },
    ];

    for (const group of defaultGroups) {
      this.addRule(group);
    }
  }

  public static addRule(rule: SynonymRule): void {
    if (rule.isBidirectional) {
      for (const t1 of rule.terms) {
        const lower1 = t1.toLowerCase();
        for (const t2 of rule.terms) {
          const lower2 = t2.toLowerCase();
          if (lower1 !== lower2) {
            this.addMapping(lower1, lower2, rule.weight);
          }
        }
      }
    } else {
      const source = rule.terms[0].toLowerCase();
      for (let i = 1; i < rule.terms.length; i++) {
        this.addMapping(source, rule.terms[i].toLowerCase(), rule.weight);
      }
    }
  }

  private static addMapping(from: string, to: string, weight: number): void {
    if (!this.synonymMap.has(from)) {
      this.synonymMap.set(from, []);
    }
    const list = this.synonymMap.get(from)!;
    if (!list.some((item) => item.term === to)) {
      list.push({ term: to, weight });
    }
  }

  /**
   * Expands query tokens with synonymous terms
   */
  public static expandTokens(tokens: string[]): Array<{ token: string; weight: number; isOriginal: boolean }> {
    const result: Array<{ token: string; weight: number; isOriginal: boolean }> = [];
    const seen = new Set<string>();

    for (const token of tokens) {
      const lower = token.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push({ token: lower, weight: 1.0, isOriginal: true });
      }

      const synonyms = this.synonymMap.get(lower);
      if (synonyms) {
        for (const syn of synonyms) {
          if (!seen.has(syn.term)) {
            seen.add(syn.term);
            result.push({ token: syn.term, weight: syn.weight, isOriginal: false });
          }
        }
      }
    }

    return result;
  }
}
