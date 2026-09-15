export class PIIProtector {
  private static readonly SENSITIVE_KEYS = new Set([
    'password',
    'password_hash',
    'salt',
    'two_factor_secret',
    'secret',
    'api_key',
    'cvv',
    'cvc',
    'access_token',
    'refresh_token',
    'payout_account_number',
    'payout_routing_number',
    'tax_id',
    'ssn',
  ]);

  /**
   * Masks credit card number leaving only the last 4 digits visible
   * e.g. 4111 2222 3333 4444 -> **** **** **** 4444
   */
  public static maskCreditCard(cardNumber: string): string {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length < 4) return '****';
    const last4 = clean.slice(-4);
    return `**** **** **** ${last4}`;
  }

  /**
   * Masks email address leaving first char and domain
   * e.g. alex.morgan@example.com -> a***n@example.com
   */
  public static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***@***.com';
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}*@${domain}`;
    }
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  /**
   * Masks phone number
   * e.g. +1-555-0199 -> +1-***-***-0199
   */
  public static maskPhone(phone: string): string {
    if (!phone) return '***';
    const clean = phone.trim();
    if (clean.length <= 4) return '***';
    return `***-***-${clean.slice(-4)}`;
  }

  /**
   * Deeply sanitizes any object or dictionary, stripping or masking all passwords, secrets, and PII
   */
  public static sanitizeSensitiveData<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      // Check for credit card pattern in raw string
      if (/\b(?:\d[ -]*?){13,16}\b/.test(obj)) {
        return this.maskCreditCard(obj) as unknown as T;
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeSensitiveData(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (this.SENSITIVE_KEYS.has(lowerKey)) {
          sanitized[key] = '[REDACTED_SECRET]';
        } else if (lowerKey.includes('email') && typeof value === 'string') {
          sanitized[key] = this.maskEmail(value);
        } else if ((lowerKey.includes('phone') || lowerKey.includes('mobile')) && typeof value === 'string') {
          sanitized[key] = this.maskPhone(value);
        } else if (lowerKey.includes('card') && typeof value === 'string') {
          sanitized[key] = this.maskCreditCard(value);
        } else {
          sanitized[key] = this.sanitizeSensitiveData(value);
        }
      }
      return sanitized as T;
    }

    return obj;
  }
}
