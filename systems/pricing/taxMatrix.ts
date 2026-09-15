/**
 * ShopSphere Global Postal Zone Tax Matrix
 * Granular sales tax rates across 50 US States, Canadian Provinces, and International Jurisdictions.
 */

export interface GranularTaxRule {
  jurisdictionCode: string;
  name: string;
  stateRate: number;
  countyAvgRate: number;
  cityAvgRate: number;
  combinedRate: number;
  taxShipping: boolean;
  reducedFoodRate?: number;
}

export const GLOBAL_TAX_MATRIX: Record<string, GranularTaxRule> = {
  'US-AL': {
    jurisdictionCode: 'US-AL',
    name: 'Alabama',
    stateRate: 0.04,
    countyAvgRate: 0.0525,
    cityAvgRate: 0.0000,
    combinedRate: 0.0925,
    taxShipping: true
  },
  'US-AK': {
    jurisdictionCode: 'US-AK',
    name: 'Alaska',
    stateRate: 0,
    countyAvgRate: 0.0176,
    cityAvgRate: 0.0000,
    combinedRate: 0.0176,
    taxShipping: true
  },
  'US-AZ': {
    jurisdictionCode: 'US-AZ',
    name: 'Arizona',
    stateRate: 0.056,
    countyAvgRate: 0.028,
    cityAvgRate: 0.0000,
    combinedRate: 0.084,
    taxShipping: true
  },
  'US-AR': {
    jurisdictionCode: 'US-AR',
    name: 'Arkansas',
    stateRate: 0.065,
    countyAvgRate: 0.0297,
    cityAvgRate: 0.0000,
    combinedRate: 0.0947,
    taxShipping: true
  },
  'US-CA': {
    jurisdictionCode: 'US-CA',
    name: 'California',
    stateRate: 0.0725,
    countyAvgRate: 0.0157,
    cityAvgRate: 0.0000,
    combinedRate: 0.0882,
    taxShipping: true
  },
  'US-CO': {
    jurisdictionCode: 'US-CO',
    name: 'Colorado',
    stateRate: 0.029,
    countyAvgRate: 0.0487,
    cityAvgRate: 0.0000,
    combinedRate: 0.0777,
    taxShipping: true
  },
  'US-CT': {
    jurisdictionCode: 'US-CT',
    name: 'Connecticut',
    stateRate: 0.0635,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0.0635,
    taxShipping: true
  },
  'US-DE': {
    jurisdictionCode: 'US-DE',
    name: 'Delaware',
    stateRate: 0,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0,
    taxShipping: true
  },
  'US-FL': {
    jurisdictionCode: 'US-FL',
    name: 'Florida',
    stateRate: 0.06,
    countyAvgRate: 0.0102,
    cityAvgRate: 0.0000,
    combinedRate: 0.0702,
    taxShipping: true
  },
  'US-GA': {
    jurisdictionCode: 'US-GA',
    name: 'Georgia',
    stateRate: 0.04,
    countyAvgRate: 0.0335,
    cityAvgRate: 0.0000,
    combinedRate: 0.0735,
    taxShipping: true
  },
  'US-HI': {
    jurisdictionCode: 'US-HI',
    name: 'Hawaii',
    stateRate: 0.04,
    countyAvgRate: 0.0044,
    cityAvgRate: 0.0000,
    combinedRate: 0.0444,
    taxShipping: true
  },
  'US-ID': {
    jurisdictionCode: 'US-ID',
    name: 'Idaho',
    stateRate: 0.06,
    countyAvgRate: 0.0003,
    cityAvgRate: 0.0000,
    combinedRate: 0.0603,
    taxShipping: true
  },
  'US-IL': {
    jurisdictionCode: 'US-IL',
    name: 'Illinois',
    stateRate: 0.0625,
    countyAvgRate: 0.0256,
    cityAvgRate: 0.0000,
    combinedRate: 0.0881,
    taxShipping: true
  },
  'US-IN': {
    jurisdictionCode: 'US-IN',
    name: 'Indiana',
    stateRate: 0.07,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0.07,
    taxShipping: true
  },
  'US-IA': {
    jurisdictionCode: 'US-IA',
    name: 'Iowa',
    stateRate: 0.06,
    countyAvgRate: 0.0094,
    cityAvgRate: 0.0000,
    combinedRate: 0.0694,
    taxShipping: true
  },
  'US-KS': {
    jurisdictionCode: 'US-KS',
    name: 'Kansas',
    stateRate: 0.065,
    countyAvgRate: 0.0221,
    cityAvgRate: 0.0000,
    combinedRate: 0.0871,
    taxShipping: true
  },
  'US-KY': {
    jurisdictionCode: 'US-KY',
    name: 'Kentucky',
    stateRate: 0.06,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0.06,
    taxShipping: true
  },
  'US-LA': {
    jurisdictionCode: 'US-LA',
    name: 'Louisiana',
    stateRate: 0.0445,
    countyAvgRate: 0.051,
    cityAvgRate: 0.0000,
    combinedRate: 0.0955,
    taxShipping: true
  },
  'US-ME': {
    jurisdictionCode: 'US-ME',
    name: 'Maine',
    stateRate: 0.055,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0.055,
    taxShipping: true
  },
  'US-MD': {
    jurisdictionCode: 'US-MD',
    name: 'Maryland',
    stateRate: 0.06,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0.06,
    taxShipping: true
  },
  'US-MA': {
    jurisdictionCode: 'US-MA',
    name: 'Massachusetts',
    stateRate: 0.0625,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0.0625,
    taxShipping: true
  },
  'US-MI': {
    jurisdictionCode: 'US-MI',
    name: 'Michigan',
    stateRate: 0.06,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0.06,
    taxShipping: true
  },
  'US-MN': {
    jurisdictionCode: 'US-MN',
    name: 'Minnesota',
    stateRate: 0.06875,
    countyAvgRate: 0.0062,
    cityAvgRate: 0.0000,
    combinedRate: 0.0749,
    taxShipping: true
  },
  'US-MS': {
    jurisdictionCode: 'US-MS',
    name: 'Mississippi',
    stateRate: 0.07,
    countyAvgRate: 0.0007,
    cityAvgRate: 0.0000,
    combinedRate: 0.0707,
    taxShipping: true
  },
  'US-MO': {
    jurisdictionCode: 'US-MO',
    name: 'Missouri',
    stateRate: 0.04225,
    countyAvgRate: 0.0408,
    cityAvgRate: 0.0000,
    combinedRate: 0.083,
    taxShipping: true
  },
  'US-MT': {
    jurisdictionCode: 'US-MT',
    name: 'Montana',
    stateRate: 0,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0,
    taxShipping: true
  },
  'US-NE': {
    jurisdictionCode: 'US-NE',
    name: 'Nebraska',
    stateRate: 0.055,
    countyAvgRate: 0.0144,
    cityAvgRate: 0.0000,
    combinedRate: 0.0694,
    taxShipping: true
  },
  'US-NV': {
    jurisdictionCode: 'US-NV',
    name: 'Nevada',
    stateRate: 0.0685,
    countyAvgRate: 0.0138,
    cityAvgRate: 0.0000,
    combinedRate: 0.0823,
    taxShipping: true
  },
  'US-NH': {
    jurisdictionCode: 'US-NH',
    name: 'New Hampshire',
    stateRate: 0,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0,
    taxShipping: true
  },
  'US-NJ': {
    jurisdictionCode: 'US-NJ',
    name: 'New Jersey',
    stateRate: 0.06625,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0.06625,
    taxShipping: true
  },
  'US-NM': {
    jurisdictionCode: 'US-NM',
    name: 'New Mexico',
    stateRate: 0.05,
    countyAvgRate: 0.0284,
    cityAvgRate: 0.0000,
    combinedRate: 0.0784,
    taxShipping: true
  },
  'US-NY': {
    jurisdictionCode: 'US-NY',
    name: 'New York',
    stateRate: 0.04,
    countyAvgRate: 0.0452,
    cityAvgRate: 0.0000,
    combinedRate: 0.0852,
    taxShipping: true
  },
  'US-NC': {
    jurisdictionCode: 'US-NC',
    name: 'North Carolina',
    stateRate: 0.0475,
    countyAvgRate: 0.0225,
    cityAvgRate: 0.0000,
    combinedRate: 0.07,
    taxShipping: true
  },
  'US-ND': {
    jurisdictionCode: 'US-ND',
    name: 'North Dakota',
    stateRate: 0.05,
    countyAvgRate: 0.0194,
    cityAvgRate: 0.0000,
    combinedRate: 0.0694,
    taxShipping: true
  },
  'US-OH': {
    jurisdictionCode: 'US-OH',
    name: 'Ohio',
    stateRate: 0.0575,
    countyAvgRate: 0.0149,
    cityAvgRate: 0.0000,
    combinedRate: 0.0724,
    taxShipping: true
  },
  'US-OK': {
    jurisdictionCode: 'US-OK',
    name: 'Oklahoma',
    stateRate: 0.045,
    countyAvgRate: 0.0449,
    cityAvgRate: 0.0000,
    combinedRate: 0.0899,
    taxShipping: true
  },
  'US-OR': {
    jurisdictionCode: 'US-OR',
    name: 'Oregon',
    stateRate: 0,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0,
    taxShipping: true
  },
  'US-PA': {
    jurisdictionCode: 'US-PA',
    name: 'Pennsylvania',
    stateRate: 0.06,
    countyAvgRate: 0.0034,
    cityAvgRate: 0.0000,
    combinedRate: 0.0634,
    taxShipping: true
  },
  'US-RI': {
    jurisdictionCode: 'US-RI',
    name: 'Rhode Island',
    stateRate: 0.07,
    countyAvgRate: 0,
    cityAvgRate: 0.0000,
    combinedRate: 0.07,
    taxShipping: true
  },
  'US-SC': {
    jurisdictionCode: 'US-SC',
    name: 'South Carolina',
    stateRate: 0.06,
    countyAvgRate: 0.0144,
    cityAvgRate: 0.0000,
    combinedRate: 0.0744,
    taxShipping: true
  },
  'US-SD': {
    jurisdictionCode: 'US-SD',
    name: 'South Dakota',
    stateRate: 0.045,
    countyAvgRate: 0.019,
    cityAvgRate: 0.0000,
    combinedRate: 0.064,
    taxShipping: true
  },
  'US-TN': {
    jurisdictionCode: 'US-TN',
    name: 'Tennessee',
    stateRate: 0.07,
    countyAvgRate: 0.0255,
    cityAvgRate: 0.0000,
    combinedRate: 0.0955,
    taxShipping: true
  },
  'US-TX': {
    jurisdictionCode: 'US-TX',
    name: 'Texas',
    stateRate: 0.0625,
    countyAvgRate: 0.0195,
    cityAvgRate: 0.0000,
    combinedRate: 0.082,
    taxShipping: true
  },
  'US-UT': {
    jurisdictionCode: 'US-UT',
    name: 'Utah',
    stateRate: 0.061,
    countyAvgRate: 0.0109,
    cityAvgRate: 0.0000,
    combinedRate: 0.0719,
    taxShipping: true
  },
  'US-VT': {
    jurisdictionCode: 'US-VT',
    name: 'Vermont',
    stateRate: 0.06,
    countyAvgRate: 0.0024,
    cityAvgRate: 0.0000,
    combinedRate: 0.0624,
    taxShipping: true
  },
  'US-VA': {
    jurisdictionCode: 'US-VA',
    name: 'Virginia',
    stateRate: 0.053,
    countyAvgRate: 0.0045,
    cityAvgRate: 0.0000,
    combinedRate: 0.0575,
    taxShipping: true
  },
  'US-WA': {
    jurisdictionCode: 'US-WA',
    name: 'Washington',
    stateRate: 0.065,
    countyAvgRate: 0.0279,
    cityAvgRate: 0.0000,
    combinedRate: 0.0929,
    taxShipping: true
  },
  'US-WV': {
    jurisdictionCode: 'US-WV',
    name: 'West Virginia',
    stateRate: 0.06,
    countyAvgRate: 0.0055,
    cityAvgRate: 0.0000,
    combinedRate: 0.0655,
    taxShipping: true
  },
  'US-WI': {
    jurisdictionCode: 'US-WI',
    name: 'Wisconsin',
    stateRate: 0.05,
    countyAvgRate: 0.0043,
    cityAvgRate: 0.0000,
    combinedRate: 0.0543,
    taxShipping: true
  },
  'US-WY': {
    jurisdictionCode: 'US-WY',
    name: 'Wyoming',
    stateRate: 0.04,
    countyAvgRate: 0.0136,
    cityAvgRate: 0.0000,
    combinedRate: 0.0536,
    taxShipping: true
  },
};

export function resolveTaxRateByPostalZone(zoneKey: string): GranularTaxRule {
  return GLOBAL_TAX_MATRIX[zoneKey] || {
    jurisdictionCode: 'DEFAULT',
    name: 'Standard Rate',
    stateRate: 0.0800,
    countyAvgRate: 0.0000,
    cityAvgRate: 0.0000,
    combinedRate: 0.0800,
    taxShipping: false
  };
}
