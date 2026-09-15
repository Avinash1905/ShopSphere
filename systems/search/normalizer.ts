export class SearchNormalizer {
  private static readonly STOP_WORDS: Set<string> = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'could', 'did', 'do', 'does', 'doing', 'down', 'during',
    'each', 'few', 'for', 'from', 'further',
    'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
    'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
    'just', 'me', 'more', 'most', 'my', 'myself',
    'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', 'should', 'so', 'some', 'such',
    'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
    'under', 'until', 'up', 'very',
    'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
    'you', 'your', 'yours', 'yourself', 'yourselves'
  ]);

  /**
   * Normalizes raw text: Unicode decomposition (NFKD), removes diacritics, strips punctuation, folds to lower case
   */
  public static normalize(text: string, removeStopWords: boolean = false): string {
    if (!text) return '';

    // 1. Unicode NFKD normalization & strip diacritical marks
    let normalized = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

    // 2. Lowercase
    normalized = normalized.toLowerCase();

    // 3. Replace symbols & special chars with whitespace except hyphens inside words
    normalized = normalized.replace(/[^a-z0-9\s-]/g, ' ');

    // 4. Collapse whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // 5. Optional stop-word removal
    if (removeStopWords) {
      const words = normalized.split(' ').filter((w) => !this.STOP_WORDS.has(w));
      normalized = words.join(' ');
    }

    return normalized;
  }

  public static isStopWord(word: string): boolean {
    return this.STOP_WORDS.has(word.toLowerCase().trim());
  }
}
