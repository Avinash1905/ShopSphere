import crypto from 'crypto';

export interface EnvelopeEncryptedPayload {
  keyId: string;
  encryptedDekBase64: string;
  ivBase64: string;
  authTagBase64: string;
  ciphertextBase64: string;
  aad?: string;
  algorithm: 'AES-256-GCM';
}

export class EnvelopeAESGCMKMS {
  private masterKeys: Map<string, Buffer> = new Map();
  private activeKeyId: string;

  constructor() {
    this.activeKeyId = 'kms-key-v1';
    this.masterKeys.set(this.activeKeyId, crypto.randomBytes(32)); // 256-bit KEK
  }

  /**
   * Generates a new Master Key version for key rotation
   */
  public rotateMasterKey(): string {
    const newVersion = this.masterKeys.size + 1;
    const newKeyId = `kms-key-v${newVersion}`;
    this.masterKeys.set(newKeyId, crypto.randomBytes(32));
    this.activeKeyId = newKeyId;
    return newKeyId;
  }

  /**
   * Encrypts plaintext data using an ephemeral Data Encryption Key (DEK) wrapped by Master KEK
   */
  public encrypt(plaintext: string, aadString?: string): EnvelopeEncryptedPayload {
    const kek = this.masterKeys.get(this.activeKeyId);
    if (!kek) throw new Error('Master key not found in KMS');

    // 1. Generate ephemeral 256-bit DEK
    const dek = crypto.randomBytes(32);

    // 2. Encrypt plaintext with DEK using AES-256-GCM
    const iv = crypto.randomBytes(12); // 96-bit standard GCM IV
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);

    if (aadString) {
      cipher.setAAD(Buffer.from(aadString, 'utf8'));
    }

    let ciphertext = cipher.update(plaintext, 'utf8');
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // 3. Encrypt DEK with Master KEK (AES-256-KW / GCM)
    const dekIv = crypto.randomBytes(12);
    const dekCipher = crypto.createCipheriv('aes-256-gcm', kek, dekIv);
    let encDek = dekCipher.update(dek);
    encDek = Buffer.concat([encDek, dekCipher.final()]);
    const dekTag = dekCipher.getAuthTag();
    const wrappedDekPayload = Buffer.concat([dekIv, dekTag, encDek]);

    return {
      keyId: this.activeKeyId,
      encryptedDekBase64: wrappedDekPayload.toString('base64'),
      ivBase64: iv.toString('base64'),
      authTagBase64: authTag.toString('base64'),
      ciphertextBase64: ciphertext.toString('base64'),
      aad: aadString,
      algorithm: 'AES-256-GCM',
    };
  }

  /**
   * Decrypts envelope encrypted payload and verifies authentication tag + AAD
   */
  public decrypt(payload: EnvelopeEncryptedPayload): string {
    const kek = this.masterKeys.get(payload.keyId);
    if (!kek) throw new Error(`Master key '${payload.keyId}' unavailable`);

    // 1. Unwrap DEK using KEK
    const wrappedDekBuffer = Buffer.from(payload.encryptedDekBase64, 'base64');
    const dekIv = wrappedDekBuffer.subarray(0, 12);
    const dekTag = wrappedDekBuffer.subarray(12, 28);
    const encDek = wrappedDekBuffer.subarray(28);

    const dekDecipher = crypto.createDecipheriv('aes-256-gcm', kek, dekIv);
    dekDecipher.setAuthTag(dekTag);
    let dek = dekDecipher.update(encDek);
    dek = Buffer.concat([dek, dekDecipher.final()]);

    // 2. Decrypt ciphertext using unwrapped DEK
    const iv = Buffer.from(payload.ivBase64, 'base64');
    const authTag = Buffer.from(payload.authTagBase64, 'base64');
    const ciphertext = Buffer.from(payload.ciphertextBase64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
    decipher.setAuthTag(authTag);

    if (payload.aad) {
      decipher.setAAD(Buffer.from(payload.aad, 'utf8'));
    }

    let plaintext = decipher.update(ciphertext, undefined, 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  }
}
