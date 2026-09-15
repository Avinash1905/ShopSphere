/**
 * ShopSphere Security Subsystem - Envelope Encryption & Key Management (AES-256-GCM)
 * Features:
 * - Authenticated symmetric encryption: AES-256-GCM with 96-bit IV and 128-bit Auth Tag
 * - Envelope Encryption: Master Key (KEK) encrypts ephemeral Data Encryption Keys (DEKs)
 * - Additional Authenticated Data (AAD) binding to prevent ciphertext transplantation
 */

import * as crypto from 'crypto';

export interface EncryptedPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
  encryptedKey: string;
  keyIv: string;
  keyAuthTag: string;
  keyId: string;
}

export class CryptoKeyManager {
  private static masterKey = crypto.scryptSync('ShopSphere-KMS-Master-Key-Secret-2026', 'salt-shopsphere', 32);

  /**
   * Encrypts plaintext using AES-256-GCM with envelope key
   */
  public static encrypt(
    plaintext: string,
    keyId: string = 'kms-key-v1',
    aad?: string
  ): EncryptedPayload {
    // 1. Generate ephemeral 256-bit DEK & 96-bit IV
    const dek = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
    if (aad) {
      cipher.setAAD(Buffer.from(aad, 'utf8'));
    }

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // 2. Encrypt DEK with Master Key
    const keyIv = crypto.randomBytes(12);
    const keyCipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, keyIv);
    let encryptedKey = keyCipher.update(dek.toString('hex'), 'utf8', 'hex');
    encryptedKey += keyCipher.final('hex');
    const keyAuthTag = keyCipher.getAuthTag().toString('hex');

    return {
      iv: iv.toString('hex'),
      authTag,
      ciphertext,
      encryptedKey,
      keyIv: keyIv.toString('hex'),
      keyAuthTag,
      keyId,
    };
  }

  /**
   * Decrypts ciphertext verifying GCM authentication tag and AAD
   */
  public static decrypt(payload: EncryptedPayload, aad?: string): string {
    const keyIv = Buffer.from(payload.keyIv, 'hex');
    const keyAuthTag = Buffer.from(payload.keyAuthTag, 'hex');

    // 1. Decrypt DEK using Master Key
    const keyDecipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, keyIv);
    keyDecipher.setAuthTag(keyAuthTag);
    let dekHex = keyDecipher.update(payload.encryptedKey, 'hex', 'utf8');
    dekHex += keyDecipher.final('utf8');
    const dek = Buffer.from(dekHex, 'hex');

    // 2. Decrypt Ciphertext using DEK
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
    decipher.setAuthTag(authTag);
    if (aad) {
      decipher.setAAD(Buffer.from(aad, 'utf8'));
    }

    let plaintext = decipher.update(payload.ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  }
}
