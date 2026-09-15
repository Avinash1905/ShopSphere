import { SearchNormalizer } from './normalizer.js';

export interface SearchToken {
  term: string;
  stemmed: string;
  soundex: string;
  position: number;
}

export class SearchTokenizer {
  /**
   * Tokenizes text into search terms with positional indices, stems, and phonetic representations
   */
  public static tokenize(text: string): SearchToken[] {
    const normalized = SearchNormalizer.normalize(text);
    if (!normalized) return [];

    const rawWords = normalized.split(/\s+/).filter(Boolean);
    const tokens: SearchToken[] = [];

    for (let pos = 0; pos < rawWords.length; pos++) {
      const word = rawWords[pos];
      if (word.length === 0) continue;

      const stemmed = this.stem(word);
      const soundex = this.soundex(word);

      tokens.push({
        term: word,
        stemmed,
        soundex,
        position: pos,
      });
    }

    return tokens;
  }

  /**
   * Generates character N-Grams (e.g. bi-grams, tri-grams) for substring matching
   */
  public static generateNgrams(term: string, n: number = 3): string[] {
    if (term.length < n) return [term];
    const ngrams: string[] = [];
    for (let i = 0; i <= term.length - n; i++) {
      ngrams.push(term.substring(i, i + n));
    }
    return ngrams;
  }

  /**
   * Soundex phonetic encoding algorithm
   */
  public static soundex(s: string): string {
    if (!s || s.length === 0) return '';
    const clean = s.toUpperCase().replace(/[^A-Z]/g, '');
    if (clean.length === 0) return '';

    const firstChar = clean[0];
    const codes: Record<string, string> = {
      B: '1', F: '1', P: '1', V: '1',
      C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
      D: '3', T: '3',
      L: '4',
      M: '5', N: '5',
      R: '6'
    };

    let result = firstChar;
    let prevCode = codes[firstChar] || '0';

    for (let i = 1; i < clean.length; i++) {
      const char = clean[i];
      const code = codes[char] || '0';

      if (code !== '0' && code !== prevCode) {
        result += code;
      }
      prevCode = code;

      if (result.length === 4) break;
    }

    while (result.length < 4) {
      result += '0';
    }

    return result;
  }

  /**
   * Porter Stemmer Algorithm (Simplified Step 1-5 rule base for English suffixes)
   */
  public static stem(word: string): string {
    if (word.length < 3) return word;

    let w = word.toLowerCase();

    // Step 1a: sses -> ss, ies -> i, ss -> ss, s -> ''
    if (w.endsWith('sses')) w = w.slice(0, -2);
    else if (w.endsWith('ies')) w = w.slice(0, -2);
    else if (!w.endsWith('ss') && w.endsWith('s')) w = w.slice(0, -1);

    // Step 1b: eed -> ee, ed -> '', ing -> ''
    if (w.endsWith('eed')) {
      if (w.length > 4) w = w.slice(0, -1);
    } else if (w.endsWith('ed')) {
      if (/[aeiou]/.test(w.slice(0, -2))) {
        w = w.slice(0, -2);
        if (w.endsWith('at') || w.endsWith('bl') || w.endsWith('iz')) w += 'e';
        else if (w.length > 2 && w[w.length - 1] === w[w.length - 2] && !['l', 's', 'z'].includes(w[w.length - 1])) {
          w = w.slice(0, -1);
        }
      }
    } else if (w.endsWith('ing')) {
      if (/[aeiou]/.test(w.slice(0, -3))) {
        w = w.slice(0, -3);
        if (w.endsWith('at') || w.endsWith('bl') || w.endsWith('iz')) w += 'e';
        else if (w.length > 2 && w[w.length - 1] === w[w.length - 2] && !['l', 's', 'z'].includes(w[w.length - 1])) {
          w = w.slice(0, -1);
        }
      }
    }

    // Step 1c: y -> i if preceded by non-vowel
    if (w.endsWith('y') && !/[aeiou]/.test(w[w.length - 2] || '')) {
      w = w.slice(0, -1) + 'i';
    }

    // Step 2 & 3: common suffixes
    if (w.endsWith('ational')) w = w.slice(0, -5) + 'e';
    else if (w.endsWith('tional')) w = w.slice(0, -2);
    else if (w.endsWith('izer')) w = w.slice(0, -1);
    else if (w.endsWith('fulness')) w = w.slice(0, -4);
    else if (w.endsWith('ousness')) w = w.slice(0, -4);
    else if (w.endsWith('alism')) w = w.slice(0, -3);
    else if (w.endsWith('ability')) w = w.slice(0, -5) + 'le';

    // Step 4 & 5: ion, er, ment, etc.
    if (w.endsWith('ement')) w = w.slice(0, -5);
    else if (w.endsWith('ment')) w = w.slice(0, -4);
    else if (w.endsWith('able')) w = w.slice(0, -4);
    else if (w.endsWith('ible')) w = w.slice(0, -4);
    else if (w.endsWith('ness')) w = w.slice(0, -4);

    return w;
  }
}
