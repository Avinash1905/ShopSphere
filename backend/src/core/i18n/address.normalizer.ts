/**
 * Address Normalizer, Deduplication, and Country Postal Code Validation
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { CountryRegistry } from './countries.data';
import { SubdivisionRegistry } from './regions.data';
import { UserAddressEntity } from '../../users/users.types';

export interface NormalizedAddress {
  recipientName: string;
  phoneNumber: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  formattedSingleLine: string;
}

export class AddressNormalizer {
  public static normalize(address: {
    recipientName: string;
    phoneNumber: string;
    streetLine1: string;
    streetLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
  }): NormalizedAddress {
    const countryCode = address.countryCode.trim().toUpperCase();
    const postalCode = address.postalCode.trim().toUpperCase().replace(/\s+/g, ' ');
    const state = SubdivisionRegistry.normalizeSubdivisionCode(countryCode, address.state);
    const city = this.titleCase(address.city.trim());
    const streetLine1 = this.titleCase(address.streetLine1.trim());
    const streetLine2 = address.streetLine2 ? this.titleCase(address.streetLine2.trim()) : undefined;
    const recipientName = this.titleCase(address.recipientName.trim());

    const lineParts = [streetLine1, streetLine2, city, state, postalCode, countryCode].filter(Boolean);
    const formattedSingleLine = lineParts.join(', ');

    return {
      recipientName,
      phoneNumber: address.phoneNumber.trim(),
      streetLine1,
      streetLine2,
      city,
      state,
      postalCode,
      countryCode,
      formattedSingleLine,
    };
  }

  public static isDuplicateAddress(a: Partial<UserAddressEntity>, b: Partial<UserAddressEntity>): boolean {
    if (!a.streetLine1 || !b.streetLine1 || !a.postalCode || !b.postalCode || !a.countryCode || !b.countryCode) {
      return false;
    }

    const cleanStreetA = this.cleanStreetForComparison(a.streetLine1);
    const cleanStreetB = this.cleanStreetForComparison(b.streetLine1);

    const sameStreet = cleanStreetA === cleanStreetB;
    const samePostal = a.postalCode.replace(/[\s-]/g, '').toUpperCase() === b.postalCode.replace(/[\s-]/g, '').toUpperCase();
    const sameCountry = a.countryCode.trim().toUpperCase() === b.countryCode.trim().toUpperCase();

    return sameStreet && samePostal && sameCountry;
  }

  private static cleanStreetForComparison(street: string): string {
    return street
      .toLowerCase()
      .replace(/\bstreet\b/g, 'st')
      .replace(/\broad\b/g, 'rd')
      .replace(/\bavenue\b/g, 'ave')
      .replace(/\bboulevard\b/g, 'blvd')
      .replace(/\blane\b/g, 'ln')
      .replace(/\bdrive\b/g, 'dr')
      .replace(/[^a-z0-9]/g, '');
  }

  private static titleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
