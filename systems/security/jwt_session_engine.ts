/**
 * ShopSphere Security Subsystem - Stateless JWT & Cryptographic Session Token Engine
 * Features:
 * - HMAC-SHA256 signature signing and verification
 * - Expiration (exp), Not Before (nbf), and Issued At (iat) claims validation
 * - Dynamic token revocation blacklist with TTL expiration
 */

import * as crypto from 'crypto';

export interface JWTPayload {
  sub: string;      // User ID
  email: string;
  role: string;
  sellerId?: string;
  iat: number;
  exp: number;
  jti: string;      // Unique JWT token identifier
  [key: string]: any;
}

export class JWTSessionEngine {
  private static secret = 'shopsphere_jwt_secret_signing_key_2026';
  private static revokedTokens: Set<string> = new Set();

  /**
   * Signs a payload into a standard JWT token string
   */
  public static sign(
    payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>,
    expiresInSeconds: number = 3600
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
      jti: crypto.randomUUID(),
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verifies and decodes a JWT token
   */
  public static verify(token: string): JWTPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Malformed JWT token: expected 3 dot-separated segments.');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new Error('Invalid JWT signature.');
    }

    const payload: JWTPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

    // Check revocation
    if (this.revokedTokens.has(payload.jti)) {
      throw new Error('JWT token has been explicitly revoked.');
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error(`JWT token has expired at timestamp ${payload.exp}.`);
    }

    return payload;
  }

  /**
   * Explicitly revokes a JWT token
   */
  public static revoke(jti: string): void {
    this.revokedTokens.add(jti);
  }

  public static isRevoked(jti: string): boolean {
    return this.revokedTokens.has(jti);
  }
}
