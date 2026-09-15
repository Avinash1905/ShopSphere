export interface ParsedSearchQuery {
  rawQuery: string;
  terms: string[];
  phrases: string[];
  negatedTerms: string[];
  fieldFilters: Record<string, string | number | boolean | { min?: number; max?: number }>;
}

export class SearchQueryParser {
  public static parse(input: string): ParsedSearchQuery {
    if (!input || input.trim() === '') {
      return {
        rawQuery: '',
        terms: [],
        phrases: [],
        negatedTerms: [],
        fieldFilters: {},
      };
    }

    const rawQuery = input.trim();
    const terms: string[] = [];
    const phrases: string[] = [];
    const negatedTerms: string[] = [];
    const fieldFilters: Record<string, any> = {};

    // 1. Extract quoted phrases e.g. "noise canceling"
    const phraseRegex = /"([^"]+)"/g;
    let match: RegExpExecArray | null;
    const cleanTokens: string[] = [];
    let lastIndex = 0;

    while ((match = phraseRegex.exec(rawQuery)) !== null) {
      if (match[1].trim()) {
        phrases.push(match[1].trim());
      }
    }

    // Remove phrases from string to parse remaining tokens
    const unquoted = rawQuery.replace(/"([^"]+)"/g, ' ');
    const tokens = unquoted.split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      // 2. Field qualifiers e.g. brand:Apple, price:100..500, rating:>=4, in_stock:true
      if (token.includes(':') && !token.startsWith('http')) {
        const [field, val] = token.split(':');
        const fieldName = field.toLowerCase().trim();
        const valueStr = val.trim();

        if (valueStr.includes('..')) {
          const [minStr, maxStr] = valueStr.split('..');
          fieldFilters[fieldName] = {
            min: minStr ? parseFloat(minStr) : undefined,
            max: maxStr ? parseFloat(maxStr) : undefined,
          };
        } else if (valueStr.startsWith('>=') || valueStr.startsWith('>')) {
          const num = parseFloat(valueStr.replace(/[>=]/g, ''));
          fieldFilters[fieldName] = { min: num };
        } else if (valueStr.startsWith('<=') || valueStr.startsWith('<')) {
          const num = parseFloat(valueStr.replace(/[<=]/g, ''));
          fieldFilters[fieldName] = { max: num };
        } else if (valueStr.toLowerCase() === 'true' || valueStr.toLowerCase() === 'false') {
          fieldFilters[fieldName] = valueStr.toLowerCase() === 'true';
        } else if (!isNaN(Number(valueStr))) {
          fieldFilters[fieldName] = Number(valueStr);
        } else {
          fieldFilters[fieldName] = valueStr;
        }
      } else if (token.startsWith('-') && token.length > 1) {
        // 3. Negated terms e.g. -refurbished
        negatedTerms.push(token.substring(1).toLowerCase());
      } else {
        // 4. Standard free search terms
        terms.push(token.toLowerCase());
      }
    }

    return {
      rawQuery,
      terms,
      phrases,
      negatedTerms,
      fieldFilters,
    };
  }
}
