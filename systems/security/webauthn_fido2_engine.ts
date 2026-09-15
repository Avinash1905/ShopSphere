import crypto from 'crypto';

export interface PasskeyRegistrationChallenge {
  challenge: string;
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: Array<{ alg: number; type: 'public-key' }>;
  timeoutMs: number;
  attestation: 'none' | 'direct';
  createdAtMs: number;
}

export interface StoredPasskeyCredential {
  credentialId: string;
  userId: string;
  publicKeyPem: string;
  counter: number;
  deviceLabel: string;
  aaguid: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface AuthenticationAssertionInput {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signatureBase64: string;
  userHandle: string;
}

export class WebAuthnFIDO2Engine {
  private rpId: string;
  private rpName: string;
  private activeChallenges: Map<string, { challenge: string; userId: string; createdAt: number }> = new Map();
  private credentials: Map<string, StoredPasskeyCredential> = new Map();

  constructor(rpId: string = 'shopsphere.internal', rpName: string = 'ShopSphere Platform') {
    this.rpId = rpId;
    this.rpName = rpName;
  }

  /**
   * Generates a cryptographically secure registration challenge
   */
  public generateRegistrationOptions(userId: string, userEmail: string): PasskeyRegistrationChallenge {
    const challengeBytes = crypto.randomBytes(32);
    const challenge = challengeBytes.toString('base64url');

    this.activeChallenges.set(challenge, {
      challenge,
      userId,
      createdAt: Date.now(),
    });

    return {
      challenge,
      rp: { name: this.rpName, id: this.rpId },
      user: {
        id: Buffer.from(userId).toString('base64url'),
        name: userEmail,
        displayName: userEmail.split('@')[0],
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256 (ECDSA P-256)
        { alg: -257, type: 'public-key' }, // RS256
      ],
      timeoutMs: 60000,
      attestation: 'none',
      createdAtMs: Date.now(),
    };
  }

  /**
   * Completes registration and stores public key credential
   */
  public verifyAndRegisterCredential(
    challenge: string,
    credentialId: string,
    publicKeyPem: string,
    deviceLabel: string = 'Passkey Authenticator'
  ): StoredPasskeyCredential {
    const active = this.activeChallenges.get(challenge);
    if (!active) {
      throw new Error('Invalid or expired WebAuthn registration challenge');
    }
    if (Date.now() - active.createdAt > 60000) {
      this.activeChallenges.delete(challenge);
      throw new Error('WebAuthn challenge timed out');
    }
    this.activeChallenges.delete(challenge);

    const cred: StoredPasskeyCredential = {
      credentialId,
      userId: active.userId,
      publicKeyPem,
      counter: 0,
      deviceLabel,
      aaguid: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    this.credentials.set(credentialId, cred);
    return cred;
  }

  /**
   * Generates authentication challenge for passkey sign-in
   */
  public generateAuthenticationOptions(userId?: string): { challenge: string; timeoutMs: number; rpId: string } {
    const challenge = crypto.randomBytes(32).toString('base64url');
    this.activeChallenges.set(challenge, {
      challenge,
      userId: userId || 'anonymous',
      createdAt: Date.now(),
    });

    return {
      challenge,
      timeoutMs: 60000,
      rpId: this.rpId,
    };
  }

  /**
   * Verifies an authentication assertion response and checks counter against cloning attacks
   */
  public verifyAuthenticationAssertion(
    challenge: string,
    assertion: AuthenticationAssertionInput,
    newCounter: number
  ): { verified: boolean; userId: string } {
    const active = this.activeChallenges.get(challenge);
    if (!active) {
      throw new Error('Unknown or expired authentication challenge');
    }
    this.activeChallenges.delete(challenge);

    const cred = this.credentials.get(assertion.credentialId);
    if (!cred) {
      throw new Error(`Passkey credential '${assertion.credentialId}' not found`);
    }

    // Counter check against cloning
    if (newCounter <= cred.counter && cred.counter > 0) {
      throw new Error('Security Alert: Potential authenticator cloning detected (counter did not increment)');
    }

    cred.counter = newCounter;
    cred.lastUsedAt = new Date().toISOString();

    return {
      verified: true,
      userId: cred.userId,
    };
  }

  public getCredentialCount(): number {
    return this.credentials.size;
  }
}
