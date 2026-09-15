import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import {
  WebAuthnFIDO2Engine,
  EnvelopeAESGCMKMS,
  DistributedDDOSSynGuard,
  ZeroTrustDeviceFingerprint,
  PCIDSSTokenizationVault,
} from '../../systems/security/index.js';
import {
  ImmutableCryptographicLedger,
  GDPRDataErasurePipeline,
  SOC2Type2EvidenceCollector,
  ForensicTimelineReconstructor,
  RegulatoryAuditExporter,
} from '../../systems/audit/index.js';

describe('Phase 7: Security Hardening & Zero-Trust Defense Pipeline', () => {
  it('should generate WebAuthn challenges and register/authenticate passkey credentials', () => {
    const engine = new WebAuthnFIDO2Engine();
    const regChallenge = engine.generateRegistrationOptions('user-123', 'admin@shopsphere.io');

    Assert.equal(regChallenge.user.name, 'admin@shopsphere.io');
    Assert.isTrue(regChallenge.challenge.length > 20);

    const cred = engine.verifyAndRegisterCredential(
      regChallenge.challenge,
      'cred-pk-1',
      '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
      'MacBook TouchID'
    );
    Assert.equal(cred.credentialId, 'cred-pk-1');
    Assert.equal(cred.userId, 'user-123');

    const authChallenge = engine.generateAuthenticationOptions('user-123');
    const authRes = engine.verifyAuthenticationAssertion(
      authChallenge.challenge,
      {
        credentialId: 'cred-pk-1',
        clientDataJSON: 'json-data',
        authenticatorData: 'auth-data',
        signatureBase64: 'sig-base64',
        userHandle: 'user-123',
      },
      1 // new counter
    );
    Assert.isTrue(authRes.verified);
    Assert.equal(authRes.userId, 'user-123');
  });

  it('should encrypt and decrypt payloads with envelope AES-256-GCM and verify AAD bindings', () => {
    const kms = new EnvelopeAESGCMKMS();
    const secretData = 'Confidential Seller Financial Bank Account Details';
    const aad = 'tenant-us-west-1';

    const payload = kms.encrypt(secretData, aad);
    Assert.equal(payload.algorithm, 'AES-256-GCM');
    Assert.notEqual(payload.ciphertextBase64, secretData);

    const decrypted = kms.decrypt(payload);
    Assert.equal(decrypted, secretData);

    // Rotate key and verify encryption with new key
    const newKeyId = kms.rotateMasterKey();
    Assert.notEqual(newKeyId, 'kms-key-v1');
    const payloadV2 = kms.encrypt(secretData, aad);
    Assert.equal(payloadV2.keyId, newKeyId);
    Assert.equal(kms.decrypt(payloadV2), secretData);
  });

  it('should enforce progressive bans and rate throttling via DistributedDDOSSynGuard', () => {
    const guard = new DistributedDDOSSynGuard(10000, 5); // 5 reqs per 10s
    const testIp = '198.51.100.44';

    for (let i = 0; i < 4; i++) {
      const decision = guard.evaluateRequest(testIp);
      Assert.isTrue(decision.allowed);
    }

    // Exceed threshold
    for (let i = 0; i < 8; i++) {
      guard.evaluateRequest(testIp);
    }

    const banDecision = guard.evaluateRequest(testIp);
    Assert.isFalse(banDecision.allowed);
    Assert.isTrue(['THROTTLE', 'TEMPORARY_BAN'].includes(banDecision.action));
  });

  it('should compute entropy device fingerprints and trigger MFA step-up on IP mutation', () => {
    const guard = new ZeroTrustDeviceFingerprint();
    const signals = {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      screenResolution: '2560x1440',
      colorDepth: 24,
      timezoneOffsetMinutes: -420,
      language: 'en-US',
      platform: 'MacIntel',
      hardwareConcurrency: 8,
    };

    guard.registerDevice('user-77', signals, '203.0.113.10');

    // Trusted evaluation with same IP
    const evalSame = guard.evaluateDevice('user-77', signals, '203.0.113.10');
    Assert.isTrue(evalSame.isRecognizedDevice);
    Assert.isFalse(evalSame.stepUpMfaRequired);

    // Mutated IP evaluation
    const evalMutated = guard.evaluateDevice('user-77', signals, '198.51.100.99');
    Assert.isTrue(evalMutated.stepUpMfaRequired, 'Step-up required when IP mutated');
    Assert.isTrue(evalMutated.riskFlags.includes('IP_ADDRESS_MUTATION'));
  });

  it('should tokenize PAN numbers with Luhn checks and format-preserving masking', () => {
    const vault = new PCIDSSTokenizationVault();
    const validVisaPan = '4532015112830366'; // Valid Luhn Visa

    Assert.isTrue(PCIDSSTokenizationVault.validateLuhn(validVisaPan));
    Assert.equal(PCIDSSTokenizationVault.detectCardBrand(validVisaPan), 'VISA');

    const tokenRecord = vault.tokenizeCard(validVisaPan, 12, 2028, 'Jane Doe');
    Assert.isTrue(tokenRecord.token.startsWith('tkn_pan_'));
    Assert.equal(tokenRecord.maskedPan, '4532-XXXX-XXXX-0366');
    Assert.equal(tokenRecord.cardBrand, 'VISA');
    Assert.equal(tokenRecord.lastFour, '0366');
  });

  it('should build immutable cryptographic audit chains and verify ledger integrity', () => {
    const ledger = new ImmutableCryptographicLedger(2); // 2 entries per block
    Assert.equal(ledger.getBlockCount(), 1, 'Genesis block present');

    ledger.appendEntry({
      actorUserId: 'admin-1',
      action: 'UPDATE_PRODUCT_PRICE',
      entityType: 'product',
      entityId: 'prod-100',
      payloadHash: 'hash-abc',
    });

    ledger.appendEntry({
      actorUserId: 'admin-2',
      action: 'GRANT_SELLER_KYC',
      entityType: 'seller',
      entityId: 'seller-50',
      payloadHash: 'hash-def',
    });

    Assert.equal(ledger.getBlockCount(), 2, 'New block sealed');
    const integrity = ledger.verifyChainIntegrity();
    Assert.isTrue(integrity.isValid, 'Cryptographic chain valid');
  });

  it('should execute GDPR Article 17 erasure and generate cryptographically signed certificates', () => {
    const gdpr = new GDPRDataErasurePipeline();
    const cert = gdpr.executeUserErasure('usr-to-forget-99');

    Assert.equal(cert.userId, 'usr-to-forget-99');
    Assert.greaterThan(cert.tablesAnonymized.length, 5);
    Assert.isTrue(cert.cryptographicProofSignature.length > 20);

    const verified = gdpr.verifyCertificate(cert);
    Assert.isTrue(verified, 'Certificate signature verified');
  });

  it('should compile and sign SOC2 Type II audit evidence packages', () => {
    const soc2 = new SOC2Type2EvidenceCollector();
    soc2.recordEvidence({
      controlId: 'CC6.1',
      trustServiceCategory: 'SECURITY',
      controlDescription: 'Logical access controls and MFA enforcement',
      testProcedure: 'Inspected MFA database and verified 100% privileged users have MFA enabled',
      status: 'COMPLIANT',
      evidenceData: { mfaEnforcedUsers: 45, totalPrivilegedUsers: 45 },
    });
    soc2.recordEvidence({
      controlId: 'CC6.6',
      trustServiceCategory: 'CONFIDENTIALITY',
      controlDescription: 'Encryption of sensitive cardholder and PII data at rest',
      testProcedure: 'Verified AES-256-GCM KMS envelope encryption in all payment tables',
      status: 'COMPLIANT',
      evidenceData: { algorithm: 'AES-256-GCM', keyRotationDays: 90 },
    });

    const auditPackage = soc2.compilePackage('2026-01-01', '2026-12-31');
    Assert.equal(auditPackage.overallComplianceStatus, 'PASS');
    Assert.equal(auditPackage.complianceRatePercent, 100);
    Assert.isTrue(auditPackage.packageIntegrityChecksum.length > 20);
  });

  it('should reconstruct forensic security incident timelines and calculate blast radius', () => {
    const now = Date.now();
    const rawEvents = [
      {
        eventId: 'e1',
        source: 'API_GATEWAY' as const,
        timestampMs: now - 30000,
        actorIp: '198.51.100.99',
        action: 'sql_injection_attempt_detected',
        severity: 'HIGH' as const,
        details: { query: 'SELECT * FROM users WHERE 1=1' },
      },
      {
        eventId: 'e2',
        source: 'DATABASE_GUARD' as const,
        timestampMs: now - 20000,
        actorIp: '198.51.100.99',
        action: 'sql_blocked_by_ast_guard',
        severity: 'CRITICAL' as const,
        details: { blocked: true },
      },
    ];

    const report = ForensicTimelineReconstructor.reconstruct(rawEvents);
    Assert.equal(report.threatCategory, 'SQL_INJECTION');
    Assert.equal(report.totalEventsInvolved, 2);
    Assert.isTrue(report.involvedIps.includes('198.51.100.99'));
    Assert.isTrue(report.estimatedBlastRadius.potentialDataLeak);
  });

  it('should export digitally signed regulatory audit packages in JSON and CSV', () => {
    const exporter = new RegulatoryAuditExporter();
    const records = [
      {
        id: 'aud-1',
        timestamp: '2026-09-15T12:00:00Z',
        actor: 'admin@shopsphere.io',
        action: 'UPDATE_KYC_STATUS',
        entityType: 'seller',
        entityId: 'seller-1',
        severity: 'MEDIUM',
        ipAddress: '192.0.2.1',
        sanitizedDetails: 'KYC verified and approved',
      },
    ];

    const pkg = exporter.exportPackage(records, 'PCI_DSS_4_0');
    Assert.equal(pkg.standard, 'PCI_DSS_4_0');
    Assert.equal(pkg.totalRecords, 1);
    Assert.isTrue(pkg.recordsCsv.includes('UPDATE_KYC_STATUS'));
    Assert.isTrue(exporter.verifyPackageSignature(pkg));
  });
});
