/**
 * ShopSphere Security Subsystem - Strict Content Security Policy & HTTP Defense Headers
 * Generates:
 * - Content-Security-Policy (CSP) with dynamic per-request cryptographic nonces
 * - Strict-Transport-Security (HSTS)
 * - X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
 */

import * as crypto from 'crypto';

export interface SecurityHeadersConfig {
  nonce?: string;
  reportUri?: string;
  allowFraming?: boolean;
}

export class CSPHeaderGenerator {
  /**
   * Generates a cryptographically random Base64 nonce
   */
  public static generateNonce(): string {
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Generates complete set of production HTTP defense headers
   */
  public static generateHeaders(config: SecurityHeadersConfig = {}): Record<string, string> {
    const nonce = config.nonce || this.generateNonce();

    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
      "img-src 'self' data: https://images.shopsphere.com https://cdn.shopsphere.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.shopsphere.com https://telemetry.shopsphere.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ];

    if (config.reportUri) {
      cspDirectives.push(`report-uri ${config.reportUri}`);
    }

    return {
      'Content-Security-Policy': cspDirectives.join('; '),
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': config.allowFraming ? 'SAMEORIGIN' : 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)',
    };
  }
}
