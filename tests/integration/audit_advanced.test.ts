/**
 * Test Suite: Advanced Audit Subsystem Integration Test
 */

import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { MerkleAuditTree } from '../../systems/audit/merkle_audit_tree.js';
import { AuditLifecycleArchiver, ArchivableAuditRecord } from '../../systems/audit/audit_lifecycle_archiver.js';
import { PCIHIPAAComplianceAuditor } from '../../systems/audit/pci_hipaa_compliance_auditor.js';
import { AuditTamperAlarm, ChainRecord } from '../../systems/audit/audit_tamper_alarm.js';
import * as crypto from 'crypto';

describe('Advanced Audit Subsystem Test Suite', () => {
  it('should build Merkle trees and verify cryptographic inclusion proofs', () => {
    const transactions = [
      { id: 'tx-1', amount: 100, user: 'u1' },
      { id: 'tx-2', amount: 200, user: 'u2' },
      { id: 'tx-3', amount: 300, user: 'u3' },
      { id: 'tx-4', amount: 400, user: 'u4' },
    ];

    const tree = new MerkleAuditTree(transactions);
    const root = tree.getRoot();
    Assert.isNotNull(root);

    // Verify proof for transaction at index 2
    const proof = tree.getProof(2);
    Assert.equal(proof.rootHash, root);

    const isValid = MerkleAuditTree.verifyProof(proof);
    Assert.isTrue(isValid, 'Merkle inclusion proof should be cryptographically valid');
  });

  it('should partition records by retention window and seal immutable archive batches', () => {
    const now = new Date('2026-09-15T00:00:00Z');
    const records: ArchivableAuditRecord[] = [
      { id: '1', action: 'ORDER_PLACED', entityType: 'order', entityId: 'o1', createdAt: new Date('2026-09-10'), hash: 'h1' }, // Hot (<90 days)
      { id: '2', action: 'USER_REGISTERED', entityType: 'user', entityId: 'u1', createdAt: new Date('2025-12-01'), hash: 'h2' }, // Cold (>90 days)
      { id: '3', action: 'PAYMENT_CAPTURED', entityType: 'payment', entityId: 'p1', createdAt: new Date('2025-11-15'), hash: 'h3' }, // Cold (>90 days)
    ];

    const partitioned = AuditLifecycleArchiver.partitionByRetention(records, 90, now);
    Assert.equal(partitioned.hotRecords.length, 1);
    Assert.equal(partitioned.coldRecords.length, 2);

    const sealed = AuditLifecycleArchiver.sealArchiveBatch(partitioned.coldRecords);
    Assert.equal(sealed.manifest.recordCount, 2);
    Assert.isNotNull(sealed.manifest.manifestChecksum);
    Assert.isNotNull(sealed.manifest.rootMerkleHash);
  });

  it('should audit data payloads for PCI-DSS & HIPAA compliance and flag leaks', () => {
    // 1. Compliant tokenized payload
    const compliantPayload = {
      orderId: 'ord-123',
      paymentMethod: 'CREDIT_CARD',
      cardLast4: '4242',
      cardBrand: 'VISA',
      amount: 99.99,
    };
    const findings1 = PCIHIPAAComplianceAuditor.auditDataPayload(compliantPayload);
    Assert.equal(findings1[0].status, 'COMPLIANT');

    // 2. Non-compliant payload with raw PAN and CVV
    const leakingPayload = {
      orderId: 'ord-456',
      cardNumber: '4532012345678901', // Raw Visa PAN
      cvv: '123',                     // Raw CVV
    };
    const findings2 = PCIHIPAAComplianceAuditor.auditDataPayload(leakingPayload);
    Assert.isTrue(findings2.some((f) => f.requirement.includes('PAN Storage Protection') && f.status === 'NON_COMPLIANT'));
    Assert.isTrue(findings2.some((f) => f.requirement.includes('Sensitive Authentication Data') && f.status === 'NON_COMPLIANT'));
  });

  it('should scan audit hash chains and trigger alarms upon detecting tampering', () => {
    // 1. Valid chain
    let prev = '0000000000000000000000000000000000000000000000000000000000000000';
    const validChain: ChainRecord[] = [];

    for (let i = 0; i < 5; i++) {
      const data = `audit_entry_${i}`;
      const hash = crypto.createHash('sha256').update(prev + data).digest('hex');
      validChain.push({ id: `log-${i}`, previousHash: prev, hash, data, sequenceNumber: i });
      prev = hash;
    }

    const scanValid = AuditTamperAlarm.scanChain(validChain);
    Assert.isTrue(scanValid.isChainIntact);
    Assert.isFalse(scanValid.alarmDispatched);

    // 2. Tampered chain
    const tamperedChain = JSON.parse(JSON.stringify(validChain));
    tamperedChain[2].data = 'altered_audit_payload_hack'; // Tampered data

    const scanTampered = AuditTamperAlarm.scanChain(tamperedChain);
    Assert.isFalse(scanTampered.isChainIntact);
    Assert.isTrue(scanTampered.alarmDispatched);
    Assert.equal(scanTampered.corruptedRecordIndex, 2);
  });
});
