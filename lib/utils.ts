import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Set of all valid US state codes (50 states)
 */
export const US_STATE_CODES = new Set([
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
]);

/**
 * Check if regions cover all 50 US states
 * @param regions Array of region objects with state codes
 * @returns true if all 50 unique US states are present
 */
export function isNationwide(regions: Array<{ code: string }>): boolean {
  if (!regions || regions.length < 50) {
    return false;
  }

  // Extract unique state codes (normalize to uppercase)
  const uniqueCodes = new Set(regions.map((r) => r.code.toUpperCase()));

  // Check if we have exactly 50 unique codes
  if (uniqueCodes.size !== 50) {
    return false;
  }

  // Verify all codes are valid US states
  return Array.from(uniqueCodes).every((code) => US_STATE_CODES.has(code));
}

/**
 * Generate state filter URL for search page
 */
export function generateStateFilterUrl(stateCode: string): string {
  return `/?states[]=${encodeURIComponent(stateCode)}`;
}
