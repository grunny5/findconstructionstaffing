import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if regions cover all 50 US states
 */
export function isNationwide(regions: Array<{ code: string }>): boolean {
  return regions.length === 50;
}

/**
 * Generate state filter URL for search page
 */
export function generateStateFilterUrl(stateCode: string): string {
  return `/?states[]=${encodeURIComponent(stateCode)}`;
}
