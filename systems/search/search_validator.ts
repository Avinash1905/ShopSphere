import { InvalidQueryError } from './search_errors.js';

export interface SearchValidationOptions {
  maxQueryLength?: number;
  maxTermsCount?: number;
  allowRegex?: boolean;
}

export class SearchValidator {
  private static readonly MAX_LENGTH = 200;
  private static readonly MAX_TERMS = 25;

  public static validate(query: string, options: SearchValidationOptions = {}): { isValid: boolean; sanitized: string } {
    const maxLen = options.maxQueryLength || this.MAX_LENGTH;
    const maxTerms = options.maxTermsCount || this.MAX_TERMS;

    if (!query || typeof query !== 'string') {
      return { isValid: true, sanitized: '' };
    }

    if (query.length > maxLen) {
      throw new InvalidQueryError(`Search query exceeds maximum length of ${maxLen} characters`);
    }

    // Strip unsafe control characters & null bytes
    let clean = query.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();

    const terms = clean.split(/\s+/).filter(Boolean);
    if (terms.length > maxTerms) {
      throw new InvalidQueryError(`Search query exceeds maximum term limit of ${maxTerms} words`);
    }

    return {
      isValid: true,
      sanitized: clean,
    };
  }
}
