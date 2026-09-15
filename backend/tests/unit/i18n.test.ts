/**
 * Unit Tests: Internationalization, Address Normalization, and Phone Formatting
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CountryRegistry } from '../../src/core/i18n/countries.data';
import { SubdivisionRegistry } from '../../src/core/i18n/regions.data';
import { AddressNormalizer } from '../../src/core/i18n/address.normalizer';
import { PhoneNormalizer } from '../../src/core/i18n/phone.normalizer';

describe('I18n, Address & Phone Normalization', () => {
  it('should validate postal codes for supported countries', () => {
    // US 5-digit & ZIP+4
    assert.equal(CountryRegistry.validatePostalCode('90210', 'US').isValid, true);
    assert.equal(CountryRegistry.validatePostalCode('90210-1234', 'US').isValid, true);
    assert.equal(CountryRegistry.validatePostalCode('INVALID', 'US').isValid, false);

    // India 6-digit PIN
    assert.equal(CountryRegistry.validatePostalCode('500001', 'IN').isValid, true);
    assert.equal(CountryRegistry.validatePostalCode('012345', 'IN').isValid, false); // cannot start with 0

    // UK alphanumeric
    assert.equal(CountryRegistry.validatePostalCode('SW1A 1AA', 'GB').isValid, true);
  });

  it('should normalize address and detect duplicates', () => {
    const addr1 = {
      recipientName: 'jane doe',
      phoneNumber: '1234567890',
      streetLine1: '123 main street',
      city: 'los angeles',
      state: 'california',
      postalCode: '90001',
      countryCode: 'us',
    };

    const normalized = AddressNormalizer.normalize(addr1);
    assert.equal(normalized.recipientName, 'Jane Doe');
    assert.equal(normalized.state, 'CA');
    assert.equal(normalized.city, 'Los Angeles');

    // Duplicate detection with abbreviations (Street vs St)
    const addr2 = {
      streetLine1: '123 Main St.',
      postalCode: '90001',
      countryCode: 'US',
    };

    const isDup = AddressNormalizer.isDuplicateAddress(addr1, addr2);
    assert.equal(isDup, true);
  });

  it('should normalize phone numbers to E.164 standard', () => {
    const usPhone = PhoneNormalizer.parse('(212) 555-1234', 'US');
    assert.equal(usPhone.e164, '+12125551234');
    assert.equal(usPhone.isValid, true);

    const intlPhone = PhoneNormalizer.parse('+91 98765 43210');
    assert.equal(intlPhone.e164, '+919876543210');
    assert.equal(intlPhone.countryCode, 'IN');
    assert.equal(intlPhone.isValid, true);
  });
});
