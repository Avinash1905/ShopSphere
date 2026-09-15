export class FuzzyMatchNormalizer {
  private synonyms: Map<string, string[]> = new Map();

  constructor() {
    this.registerSynonym('laptop', ['notebook', 'macbook', 'chromebook']);
    this.registerSynonym('phone', ['mobile', 'cellphone', 'smartphone', 'iphone']);
    this.registerSynonym('sneakers', ['shoes', 'trainers', 'footwear', 'kicks']);
  }

  public registerSynonym(root: string, aliases: string[]): void {
    this.synonyms.set(root.toLowerCase(), aliases.map(a => a.toLowerCase()));
  }

  public levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  public expandQueryWithSynonyms(term: string): string[] {
    const t = term.toLowerCase().trim();
    const result = new Set<string>([t]);
    for (const [root, aliases] of this.synonyms.entries()) {
      if (root === t || aliases.includes(t)) {
        result.add(root);
        aliases.forEach(a => result.add(a));
      }
    }
    return Array.from(result);
  }
}
