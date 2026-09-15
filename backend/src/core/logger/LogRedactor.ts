/**
 * Security Data Redactor for Safe Structured Logging
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

export class LogRedactor {
  private static readonly SENSITIVE_KEYS = new Set([
    'password',
    'plainpassword',
    'currentpassword',
    'newpassword',
    'confirmpassword',
    'oldpassword',
    'token',
    'accesstoken',
    'refreshtoken',
    'resettoken',
    'resetpasswordtoken',
    'verificationtoken',
    'secret',
    'cookiesecret',
    'jwtsecret',
    'apikey',
    'api_key',
    'authorization',
    'cookie',
    'set-cookie',
    'creditcard',
    'cardnumber',
    'cvv',
    'cvc',
    'ssn',
  ]);

  private static readonly REDACTED_PLACEHOLDER = '[REDACTED]';

  public static redact<T>(input: T, depth = 0, maxDepth = 6): T {
    if (depth > maxDepth) {
      return '[MAX_DEPTH_REACHED]' as unknown as T;
    }

    if (input === null || input === undefined) {
      return input;
    }

    if (typeof input === 'string') {
      return this.redactString(input) as unknown as T;
    }

    if (typeof input !== 'object') {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.redact(item, depth + 1, maxDepth)) as unknown as T;
    }

    if (input instanceof Error) {
      return {
        name: input.name,
        message: input.message,
        stack: input.stack,
        ...('code' in input ? { code: (input as { code: unknown }).code } : {}),
        ...('details' in input ? { details: this.redact((input as { details: unknown }).details, depth + 1, maxDepth) } : {}),
      } as unknown as T;
    }

    const copy: Record<string, unknown> = {};
    const obj = input as Record<string, unknown>;

    for (const key of Object.keys(obj)) {
      const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');

      if (this.SENSITIVE_KEYS.has(normalizedKey)) {
        copy[key] = this.REDACTED_PLACEHOLDER;
      } else {
        copy[key] = this.redact(obj[key], depth + 1, maxDepth);
      }
    }

    return copy as T;
  }

  private static redactString(str: string): string {
    // Redact Bearer tokens in headers
    if (/^Bearer\s+[A-Za-z0-9-_=.]+/i.test(str)) {
      return 'Bearer [REDACTED_TOKEN]';
    }
    // Redact JWT patterns
    if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(str)) {
      return '[REDACTED_JWT]';
    }
    return str;
  }
}
