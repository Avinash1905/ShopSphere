import crypto from 'crypto';

export type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'UNKNOWN';

export interface TokenizedCardRecord {
  token: string;
  maskedPan: string;
  cardBrand: CardBrand;
  lastFour: string;
  expMonth: number;
  expYear: number;
  cardholderName: string;
  fingerprintSha256: string;
  createdAt: string;
}

export class PCIDSSTokenizationVault {
  private vault: Map<string, TokenizedCardRecord> = new Map();
  private secretSalt: Buffer;

  constructor() {
    this.secretSalt = crypto.randomBytes(32);
  }

  /**
   * Validates Primary Account Number (PAN) using Luhn Mod-10 algorithm
   */
  public static validateLuhn(pan: string): boolean {
    const clean = pan.replace(/\D/g, '');
    if (clean.length < 13 || clean.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  /**
   * Detects major payment card brands from PAN prefix patterns
   */
  public static detectCardBrand(pan: string): CardBrand {
    const clean = pan.replace(/\D/g, '');
    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(clean)) return 'VISA';
    if (/^5[1-5][0-9]{14}$|^2(?:2(?:2[1-9]|[3-9][0-9])|[3-6][0-9][0-9]|7(?:[01][0-9]|20))[0-9]{12}$/.test(clean)) return 'MASTERCARD';
    if (/^3[47][0-9]{13}$/.test(clean)) return 'AMEX';
    if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(clean)) return 'DISCOVER';
    return 'UNKNOWN';
  }

  /**
   * Generates format-preserving masked card string (e.g. 4111-XXXX-XXXX-1111)
   */
  public static maskPan(pan: string): string {
    const clean = pan.replace(/\D/g, '');
    if (clean.length < 10) return 'XXXX-XXXX-XXXX-XXXX';
    const firstFour = clean.substring(0, 4);
    const lastFour = clean.substring(clean.length - 4);
    return `${firstFour}-XXXX-XXXX-${lastFour}`;
  }

  /**
   * Tokenizes payment card details into surrogate token
   */
  public tokenizeCard(
    pan: string,
    expMonth: number,
    expYear: number,
    cardholderName: string
  ): TokenizedCardRecord {
    const cleanPan = pan.replace(/\D/g, '');
    if (!PCIDSSTokenizationVault.validateLuhn(cleanPan)) {
      throw new Error('Invalid Card PAN: Failed Luhn Mod-10 checksum validation');
    }

    const brand = PCIDSSTokenizationVault.detectCardBrand(cleanPan);
    const masked = PCIDSSTokenizationVault.maskPan(cleanPan);
    const lastFour = cleanPan.substring(cleanPan.length - 4);

    // One-way cryptographic fingerprint (salted SHA-256)
    const fingerprint = crypto.createHmac('sha256', this.secretSalt).update(cleanPan).digest('hex');

    const token = `tkn_pan_${crypto.randomBytes(16).toString('hex')}`;

    const record: TokenizedCardRecord = {
      token,
      maskedPan: masked,
      cardBrand: brand,
      lastFour,
      expMonth,
      expYear,
      cardholderName: cardholderName.trim().toUpperCase(),
      fingerprintSha256: fingerprint,
      createdAt: new Date().toISOString(),
    };

    this.vault.set(token, record);
    return record;
  }

  public getCard(token: string): TokenizedCardRecord | undefined {
    return this.vault.get(token);
  }

  public size(): number {
    return this.vault.size;
  }
}
