/**
 * Subdivisions, States, and Provinces Registry for Major E-Commerce Markets
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

export interface SubdivisionInfo {
  code: string;
  name: string;
}

export const SUBDIVISIONS_BY_COUNTRY: Record<string, SubdivisionInfo[]> = {
  US: [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' }
  ],
  CA: [
    { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' }, { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'New Brunswick' }, { code: 'NL', name: 'Newfoundland and Labrador' },
    { code: 'NS', name: 'Nova Scotia' }, { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' },
    { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' }, { code: 'NT', name: 'Northwest Territories' },
    { code: 'NU', name: 'Nunavut' }, { code: 'YT', name: 'Yukon' }
  ],
  IN: [
    { code: 'AP', name: 'Andhra Pradesh' }, { code: 'AR', name: 'Arunachal Pradesh' }, { code: 'AS', name: 'Assam' },
    { code: 'BR', name: 'Bihar' }, { code: 'CG', name: 'Chhattisgarh' }, { code: 'GA', name: 'Goa' },
    { code: 'GJ', name: 'Gujarat' }, { code: 'HR', name: 'Haryana' }, { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'JH', name: 'Jharkhand' }, { code: 'KA', name: 'Karnataka' }, { code: 'KL', name: 'Kerala' },
    { code: 'MP', name: 'Madhya Pradesh' }, { code: 'MH', name: 'Maharashtra' }, { code: 'MN', name: 'Manipur' },
    { code: 'ML', name: 'Meghalaya' }, { code: 'MZ', name: 'Mizoram' }, { code: 'NL', name: 'Nagaland' },
    { code: 'OD', name: 'Odisha' }, { code: 'PB', name: 'Punjab' }, { code: 'RJ', name: 'Rajasthan' },
    { code: 'SK', name: 'Sikkim' }, { code: 'TN', name: 'Tamil Nadu' }, { code: 'TS', name: 'Telangana' },
    { code: 'TR', name: 'Tripura' }, { code: 'UP', name: 'Uttar Pradesh' }, { code: 'UK', name: 'Uttarakhand' },
    { code: 'WB', name: 'West Bengal' }, { code: 'DL', name: 'Delhi' }
  ],
  AU: [
    { code: 'NSW', name: 'New South Wales' }, { code: 'VIC', name: 'Victoria' }, { code: 'QLD', name: 'Queensland' },
    { code: 'WA', name: 'Western Australia' }, { code: 'SA', name: 'South Australia' },
    { code: 'TAS', name: 'Tasmania' }, { code: 'ACT', name: 'Australian Capital Territory' },
    { code: 'NT', name: 'Northern Territory' }
  ]
};

export class SubdivisionRegistry {
  public static getSubdivisions(countryCode: string): SubdivisionInfo[] {
    return SUBDIVISIONS_BY_COUNTRY[countryCode.toUpperCase().trim()] || [];
  }

  public static isValidSubdivision(countryCode: string, stateOrCode: string): boolean {
    const list = this.getSubdivisions(countryCode);
    if (list.length === 0) {
      // If we don't have subdivision data for this country, accept valid string length
      return typeof stateOrCode === 'string' && stateOrCode.trim().length >= 2;
    }

    const input = stateOrCode.trim().toUpperCase();
    return list.some((s) => s.code.toUpperCase() === input || s.name.toUpperCase() === input);
  }

  public static normalizeSubdivisionCode(countryCode: string, stateOrCode: string): string {
    const list = this.getSubdivisions(countryCode);
    if (list.length === 0) return stateOrCode.trim();

    const input = stateOrCode.trim().toUpperCase();
    const match = list.find((s) => s.code.toUpperCase() === input || s.name.toUpperCase() === input);
    return match ? match.code : stateOrCode.trim();
  }
}
