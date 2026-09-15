/**
 * ISO 3166 Country Data and Postal Code Validation Rules
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

export interface CountryInfo {
  name: string;
  alpha2: string;
  alpha3: string;
  numeric: string;
  dialCode: string;
  postalCodeRegex?: RegExp;
  postalCodeFormat?: string;
  hasSubdivisions: boolean;
}

export const COUNTRIES_DATA: Record<string, CountryInfo> = {
  US: {
    name: 'United States',
    alpha2: 'US',
    alpha3: 'USA',
    numeric: '840',
    dialCode: '+1',
    postalCodeRegex: /^\d{5}(-\d{4})?$/,
    postalCodeFormat: 'NNNNN or NNNNN-NNNN',
    hasSubdivisions: true,
  },
  CA: {
    name: 'Canada',
    alpha2: 'CA',
    alpha3: 'CAN',
    numeric: '124',
    dialCode: '+1',
    postalCodeRegex: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    postalCodeFormat: 'ANA NAN',
    hasSubdivisions: true,
  },
  GB: {
    name: 'United Kingdom',
    alpha2: 'GB',
    alpha3: 'GBR',
    numeric: '826',
    dialCode: '+44',
    postalCodeRegex: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/,
    postalCodeFormat: 'AA9A 9AA',
    hasSubdivisions: true,
  },
  IN: {
    name: 'India',
    alpha2: 'IN',
    alpha3: 'IND',
    numeric: '356',
    dialCode: '+91',
    postalCodeRegex: /^[1-9]\d{5}$/,
    postalCodeFormat: 'NNNNNN (6 digits)',
    hasSubdivisions: true,
  },
  AU: {
    name: 'Australia',
    alpha2: 'AU',
    alpha3: 'AUS',
    numeric: '036',
    dialCode: '+61',
    postalCodeRegex: /^\d{4}$/,
    postalCodeFormat: 'NNNN (4 digits)',
    hasSubdivisions: true,
  },
  DE: {
    name: 'Germany',
    alpha2: 'DE',
    alpha3: 'DEU',
    numeric: '276',
    dialCode: '+49',
    postalCodeRegex: /^\d{5}$/,
    postalCodeFormat: 'NNNNN (5 digits)',
    hasSubdivisions: true,
  },
  FR: {
    name: 'France',
    alpha2: 'FR',
    alpha3: 'FRA',
    numeric: '250',
    dialCode: '+33',
    postalCodeRegex: /^\d{5}$/,
    postalCodeFormat: 'NNNNN (5 digits)',
    hasSubdivisions: true,
  },
  JP: {
    name: 'Japan',
    alpha2: 'JP',
    alpha3: 'JPN',
    numeric: '392',
    dialCode: '+81',
    postalCodeRegex: /^\d{3}-?\d{4}$/,
    postalCodeFormat: 'NNN-NNNN',
    hasSubdivisions: true,
  },
  SG: {
    name: 'Singapore',
    alpha2: 'SG',
    alpha3: 'SGP',
    numeric: '702',
    dialCode: '+65',
    postalCodeRegex: /^\d{6}$/,
    postalCodeFormat: 'NNNNNN (6 digits)',
    hasSubdivisions: false,
  },
  AE: {
    name: 'United Arab Emirates',
    alpha2: 'AE',
    alpha3: 'ARE',
    numeric: '784',
    dialCode: '+971',
    hasSubdivisions: true,
  },
  NL: {
    name: 'Netherlands',
    alpha2: 'NL',
    alpha3: 'NLD',
    numeric: '528',
    dialCode: '+31',
    postalCodeRegex: /^\d{4}\s?[A-Za-z]{2}$/,
    postalCodeFormat: 'NNNN AA',
    hasSubdivisions: true,
  },
  BR: {
    name: 'Brazil',
    alpha2: 'BR',
    alpha3: 'BRA',
    numeric: '076',
    dialCode: '+55',
    postalCodeRegex: /^\d{5}-?\d{3}$/,
    postalCodeFormat: 'NNNNN-NNN',
    hasSubdivisions: true,
  },
  MX: {
    name: 'Mexico',
    alpha2: 'MX',
    alpha3: 'MEX',
    numeric: '484',
    dialCode: '+52',
    postalCodeRegex: /^\d{5}$/,
    postalCodeFormat: 'NNNNN (5 digits)',
    hasSubdivisions: true,
  },
  IT: {
    name: 'Italy',
    alpha2: 'IT',
    alpha3: 'ITA',
    numeric: '380',
    dialCode: '+39',
    postalCodeRegex: /^\d{5}$/,
    postalCodeFormat: 'NNNNN (5 digits)',
    hasSubdivisions: true,
  },
  ES: {
    name: 'Spain',
    alpha2: 'ES',
    alpha3: 'ESP',
    numeric: '724',
    dialCode: '+34',
    postalCodeRegex: /^\d{5}$/,
    postalCodeFormat: 'NNNNN (5 digits)',
    hasSubdivisions: true,
  },
  NZ: {
    name: 'New Zealand',
    alpha2: 'NZ',
    alpha3: 'NZL',
    numeric: '554',
    dialCode: '+64',
    postalCodeRegex: /^\d{4}$/,
    postalCodeFormat: 'NNNN (4 digits)',
    hasSubdivisions: true,
  },
  CH: {
    name: 'Switzerland',
    alpha2: 'CH',
    alpha3: 'CHE',
    numeric: '756',
    dialCode: '+41',
    postalCodeRegex: /^\d{4}$/,
    postalCodeFormat: 'NNNN (4 digits)',
    hasSubdivisions: true,
  },
  SE: {
    name: 'Sweden',
    alpha2: 'SE',
    alpha3: 'SWE',
    numeric: '752',
    dialCode: '+46',
    postalCodeRegex: /^\d{3}\s?\d{2}$/,
    postalCodeFormat: 'NNN NN',
    hasSubdivisions: true,
  },
  NO: {
    name: 'Norway',
    alpha2: 'NO',
    alpha3: 'NOR',
    numeric: '578',
    dialCode: '+47',
    postalCodeRegex: /^\d{4}$/,
    postalCodeFormat: 'NNNN (4 digits)',
    hasSubdivisions: true,
  },
  DK: {
    name: 'Denmark',
    alpha2: 'DK',
    alpha3: 'DNK',
    numeric: '208',
    dialCode: '+45',
    postalCodeRegex: /^\d{4}$/,
    postalCodeFormat: 'NNNN (4 digits)',
    hasSubdivisions: true,
  },
  IE: {
    name: 'Ireland',
    alpha2: 'IE',
    alpha3: 'IRL',
    numeric: '372',
    dialCode: '+353',
    postalCodeRegex: /^[A-Za-z\d]{3}\s?[A-Za-z\d]{4}$/,
    postalCodeFormat: 'A65 F4E2',
    hasSubdivisions: true,
  },
  ZA: {
    name: 'South Africa',
    alpha2: 'ZA',
    alpha3: 'ZAF',
    numeric: '710',
    dialCode: '+27',
    postalCodeRegex: /^\d{4}$/,
    postalCodeFormat: 'NNNN (4 digits)',
    hasSubdivisions: true,
  },
};

export class CountryRegistry {
  public static getCountry(alpha2Or3: string): CountryInfo | undefined {
    const code = alpha2Or3.toUpperCase().trim();
    if (COUNTRIES_DATA[code]) {
      return COUNTRIES_DATA[code];
    }
    return Object.values(COUNTRIES_DATA).find((c) => c.alpha3 === code);
  }

  public static isValidCountryCode(alpha2Or3: string): boolean {
    return this.getCountry(alpha2Or3) !== undefined;
  }

  public static validatePostalCode(postalCode: string, countryCode: string): { isValid: boolean; expectedFormat?: string } {
    const country = this.getCountry(countryCode);
    if (!country) {
      return { isValid: false, expectedFormat: 'Unknown country' };
    }

    if (!country.postalCodeRegex) {
      // If country has no specific regex, allow basic alphanumeric 3-10 chars
      const genericRegex = /^[A-Za-z0-9\s-]{3,10}$/;
      return { isValid: genericRegex.test(postalCode.trim()), expectedFormat: 'Alphanumeric 3-10 characters' };
    }

    const isValid = country.postalCodeRegex.test(postalCode.trim());
    return { isValid, expectedFormat: country.postalCodeFormat };
  }
}
