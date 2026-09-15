/**
 * Cryptographic Utilities for Secure Token Generation and Hashing
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import crypto from 'crypto';

export class CryptoUtils {
  /**
   * Generates a cryptographically secure random string with given byte length
   */
  public static generateSecureToken(byteLength = 32): string {
    return crypto.randomBytes(byteLength).toString('hex');
  }

  /**
   * Generates a URL-safe base64 encoded secure random token
   */
  public static generateUrlSafeToken(byteLength = 32): string {
    return crypto.randomBytes(byteLength).toString('base64url');
  }

  /**
   * Generates a numeric one-time passcode of specified digit length
   */
  public static generateNumericCode(length = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max + 1).toString();
  }

  /**
   * Computes SHA-256 hash of a string (useful for storing reset tokens & refresh tokens)
   */
  public static hashSha256(input: string, salt = ''): string {
    return crypto.createHash('sha256').update(input + salt).digest('hex');
  }

  /**
   * Computes HMAC SHA-256 of a message using a secret
   */
  public static hmacSha256(secret: string, message: string): string {
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  public static timingSafeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }

    const bufA = Buffer.from(a, 'utf-8');
    const bufB = Buffer.from(b, 'utf-8');

    if (bufA.length !== bufB.length) {
      // Execute dummy timing safe compare to keep constant time execution
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Validates if a given string is a valid UUID v4
   */
  public static isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return typeof uuid === 'string' && uuidRegex.test(uuid);
  }
}
