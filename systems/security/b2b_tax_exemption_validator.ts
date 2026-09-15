export interface TaxExemptionValidationResult {
  jurisdiction: string;
  certificateOrVatNumber: string;
  isValidFormat: boolean;
  isExpired: boolean;
  status: 'VALID' | 'INVALID_FORMAT' | 'EXPIRED' | 'BLOCKED';
  reason?: string;
}

export class B2BTaxExemptionValidator {
  private static readonly VAT_REGEX_PATTERNS: Record<string, RegExp> = {
    US: /^[0-9]{2}-[0-9]{7}$|^[0-9]{9}$/, // US EIN / Resale Permit
    DE: /^DE[0-9]{9}$/, // Germany VAT
    FR: /^FR[A-Z0-9]{2}[0-9]{9}$/, // France VAT
    GB: /^GB([0-9]{9}|[0-9]{12}|(GD|HA)[0-9]{3})$/, // UK VAT
    IT: /^IT[0-9]{11}$/, // Italy VAT
    NL: /^NL[0-9]{9}B[0-9]{2}$/, // Netherlands VAT
  };

  /**
   * Validates corporate tax exemption certificate number and expiration status
   */
  public static validateCertificate(
    jurisdiction: string,
    idNumber: string,
    expirationDateStr?: string
  ): TaxExemptionValidationResult {
    const cleanNumber = idNumber.replace(/\s|-/g, '').toUpperCase();
    const pattern = this.VAT_REGEX_PATTERNS[jurisdiction.toUpperCase()];

    if (!pattern) {
      // Default basic alphanumeric check (min 6 chars)
      const isValid = cleanNumber.length >= 6 && /^[A-Z0-9]+$/.test(cleanNumber);
      return {
        jurisdiction,
        certificateOrVatNumber: idNumber,
        isValidFormat: isValid,
        isExpired: false,
        status: isValid ? 'VALID' : 'INVALID_FORMAT',
        reason: isValid ? undefined : 'Unrecognized jurisdiction format standard',
      };
    }

    const testTarget = jurisdiction.toUpperCase() === 'US' ? idNumber.trim() : cleanNumber;
    const isFormatValid = pattern.test(testTarget);

    if (!isFormatValid) {
      return {
        jurisdiction,
        certificateOrVatNumber: idNumber,
        isValidFormat: false,
        isExpired: false,
        status: 'INVALID_FORMAT',
        reason: `Identification number '${idNumber}' does not match standard ${jurisdiction} syntax pattern.`,
      };
    }

    let isExpired = false;
    if (expirationDateStr) {
      const expMs = new Date(expirationDateStr).getTime();
      const nowMs = Date.now();
      if (expMs < nowMs) {
        isExpired = true;
      }
    }

    return {
      jurisdiction,
      certificateOrVatNumber: idNumber,
      isValidFormat: true,
      isExpired,
      status: isExpired ? 'EXPIRED' : 'VALID',
      reason: isExpired ? `Certificate expired on ${expirationDateStr}` : undefined,
    };
  }
}
