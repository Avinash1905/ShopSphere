/**
 * ShopSphere Security Penetration Test: Envelope Encryption & PCI-DSS Compliance
 * Tests cryptographic defenses against tampering, AAD context hijacking,
 * and automated PCI-DSS / HIPAA sensitive data leak scanning.
 */

import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { CryptoKeyManager } from '../../systems/security/crypto_key_manager.js';
import { PCIHIPAAComplianceAuditor } from '../../systems/audit/pci_hipaa_compliance_auditor.js';

describe('Security: Envelope Crypto & PCI Penetration Test', () => {
  it('should reject tampered ciphertexts and invalid authentication tags', () => {
    const payload = 'CONFIDENTIAL_BUYER_PASSPORT_991823';
    const aad = 'buyer:profile:auth_v1';

    const envelope = CryptoKeyManager.encrypt(payload, 'kms-key-1', aad);

    // 1. Bit-flip in ciphertext payload
    const tamperedCiphertextEnvelope = {
      ...envelope,
      ciphertext: envelope.ciphertext.slice(0, 10) + 'X' + envelope.ciphertext.slice(11),
    };


    let bitFlipCaught = false;
    try {
      CryptoKeyManager.decrypt(tamperedCiphertextEnvelope, aad);
    } catch (err: any) {
      bitFlipCaught = true;
    }
    Assert.isTrue(bitFlipCaught, 'Decryption must fail when ciphertext is modified');

    // 2. Tampered Auth Tag
    const tamperedTagEnvelope = {
      ...envelope,
      authTag: '00000000000000000000000000000000',
    };


    let tagTamperCaught = false;
    try {
      CryptoKeyManager.decrypt(tamperedTagEnvelope, aad);
    } catch (err: any) {
      tagTamperCaught = true;
    }
    Assert.isTrue(tagTamperCaught, 'Decryption must fail when auth tag is corrupted');

    // 3. AAD context mismatch
    let aadMismatchCaught = false;
    try {
      CryptoKeyManager.decrypt(envelope, 'different:security:context:aad');
    } catch (err: any) {
      aadMismatchCaught = true;
    }
    Assert.isTrue(aadMismatchCaught, 'Decryption must fail when AAD context does not match');
  });


  it('should scan and detect 100% of cleartext PAN and CVV leaks via PCI-DSS audit scanner', () => {
    // Audit clean records
    const cleanRecord = {
      user_id: 'usr-123',
      order_id: 'ord-456',
      masked_card: '************4242',
      payment_method: 'VISA_DEBIT',
    };


    const cleanFindings = PCIHIPAAComplianceAuditor.auditDataPayload(cleanRecord);
    const cleanViolations = cleanFindings.filter((f) => f.status === 'NON_COMPLIANT');
    Assert.equal(cleanViolations.length, 0, 'Clean record should produce 0 compliance violations');

    // Audit leaking records with raw Visa, Mastercard PANs and CVVs
    const leakingRecords = [
      { id: '1', note: 'Customer card: 4111222233334444' },
      { id: '2', cvv: '789' },
      { id: '3', password: 'plain_password_123' },
    ];

    let totalViolations = 0;
    for (const rec of leakingRecords) {
      const findings = PCIHIPAAComplianceAuditor.auditDataPayload(rec);
      totalViolations += findings.filter((f) => f.status === 'NON_COMPLIANT').length;
    }

    Assert.greaterThanOrEqual(totalViolations, 3, 'Auditor must detect all sensitive PAN/CVV/Password leaks');
  });
});
