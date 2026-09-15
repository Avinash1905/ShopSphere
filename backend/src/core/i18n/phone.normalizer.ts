/**
 * E.164 Phone Number Formatter and Country Dial Code Normalizer
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { CountryRegistry } from './countries.data';

export interface ParsedPhoneNumber {
  raw: string;
  e164: string;
  countryCode?: string;
  nationalNumber: string;
  isValid: boolean;
}

export class PhoneNormalizer {
  public static parse(phoneNumber: string, defaultCountry = 'US'): ParsedPhoneNumber {
    const raw = phoneNumber.trim();
    const digitsOnly = raw.replace(/\D/g, '');

    // Check if starts with +
    if (raw.startsWith('+')) {
      const e164 = `+${digitsOnly}`;
      const detectedCountry = this.detectCountryFromDialCode(digitsOnly);
      const isValid = digitsOnly.length >= 7 && digitsOnly.length <= 15;

      return {
        raw,
        e164,
        countryCode: detectedCountry,
        nationalNumber: digitsOnly,
        isValid,
      };
    }

    // Attempt prepend of default country dial code
    const country = CountryRegistry.getCountry(defaultCountry);
    const dialCode = country?.dialCode ? country.dialCode.replace(/\D/g, '') : '1';

    let e164Digits = digitsOnly;
    if (!digitsOnly.startsWith(dialCode)) {
      e164Digits = `${dialCode}${digitsOnly}`;
    }

    const isValid = e164Digits.length >= 7 && e164Digits.length <= 15;

    return {
      raw,
      e164: `+${e164Digits}`,
      countryCode: defaultCountry,
      nationalNumber: digitsOnly,
      isValid,
    };
  }

  private static detectCountryFromDialCode(digits: string): string | undefined {
    if (digits.startsWith('1')) return 'US';
    if (digits.startsWith('44')) return 'GB';
    if (digits.startsWith('91')) return 'IN';
    if (digits.startsWith('61')) return 'AU';
    if (digits.startsWith('49')) return 'DE';
    if (digits.startsWith('33')) return 'FR';
    if (digits.startsWith('81')) return 'JP';
    if (digits.startsWith('65')) return 'SG';
    if (digits.startsWith('971')) return 'AE';
    return undefined;
  }
}
