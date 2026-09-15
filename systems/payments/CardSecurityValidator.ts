export class CardSecurityValidator {
  public static validateLuhn(cardNumber: string): boolean {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length < 13 || clean.length > 19) return false;
    let sum = 0;
    let isSecond = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      if (isSecond) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isSecond = !isSecond;
    }
    return sum % 10 === 0;
  }

  public static detectCardBrand(cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown' {
    const clean = cardNumber.replace(/\D/g, '');
    if (/^4\d{12}(\d{3})?$/.test(clean)) return 'visa';
    if (/^(5[1-5]\d{4}|222[1-9]\d{2}|22[3-9]\d{3}|2[3-6]\d{4}|27[01]\d{3}|2720\d{2})\d{10}$/.test(clean)) return 'mastercard';
    if (/^3[47]\d{13}$/.test(clean)) return 'amex';
    if (/^6(?:011|5\d{2})\d{12}$/.test(clean)) return 'discover';
    return 'unknown';
  }

  public static validateCvv(cvv: string, brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'): boolean {
    const clean = cvv.trim();
    if (brand === 'amex') return /^\d{4}$/.test(clean);
    return /^\d{3}$/.test(clean);
  }
}
