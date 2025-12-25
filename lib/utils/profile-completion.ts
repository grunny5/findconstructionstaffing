import type { Agency } from '@/types/supabase';

/**
 * Calculates the profile completion percentage for an agency based on a weighted scoring formula.
 *
 * Scoring breakdown (total 100%):
 * - Basic Info (20%): Name (5%), Description (10%), Website (5%)
 * - Contact (15%): Phone (5%), Email (5%), Headquarters (5%)
 * - Services (40%): Trades selected (20%), Regions selected (20%)
 * - Additional (15%): Logo (10%), Founded Year (5%)
 * - Details (10%): Employee Count (5%), Company Size (5%)
 *
 * @param agency - The agency object to calculate completion for
 * @returns A number between 0 and 100 representing the completion percentage
 *
 * @example
 * ```typescript
 * const agency: Agency = {
 *   id: '123',
 *   name: 'ABC Staffing',
 *   slug: 'abc-staffing',
 *   description: 'We provide skilled workers',
 *   website: 'https://abc.com',
 *   phone: '555-1234',
 *   email: 'contact@abc.com',
 *   headquarters: 'Houston, TX',
 *   logo_url: 'https://example.com/logo.png',
 *   founded_year: 2010,
 *   employee_count: '50-100',
 *   company_size: 'Medium',
 *   trades: [{ id: '1', name: 'Electrician', slug: 'electrician' }],
 *   regions: [{ id: '1', name: 'Texas', state_code: 'TX', slug: 'texas' }],
 *   // ... other required fields
 * };
 *
 * const completion = calculateProfileCompletion(agency);
 * // Returns: 100 (all fields complete)
 * ```
 *
 * @example
 * ```typescript
 * // Minimal profile (only required fields)
 * const minimalAgency: Agency = {
 *   id: '456',
 *   name: 'XYZ Staffing',
 *   slug: 'xyz-staffing',
 *   is_claimed: false,
 *   is_active: true,
 *   offers_per_diem: false,
 *   is_union: false,
 *   created_at: '2024-01-01',
 *   updated_at: '2024-01-01',
 * };
 *
 * const completion = calculateProfileCompletion(minimalAgency);
 * // Returns: 5 (only name is provided, which is 5%)
 * ```
 */
export function calculateProfileCompletion(agency: Agency): number {
  let score = 0;

  // ========================================
  // Basic Info (20%)
  // ========================================

  // Name (5%) - Required field, always present
  if (agency.name && agency.name.trim().length > 0) {
    score += 5;
  }

  // Description (10%)
  if (agency.description && agency.description.trim().length > 0) {
    score += 10;
  }

  // Website (5%)
  if (agency.website && agency.website.trim().length > 0) {
    score += 5;
  }

  // ========================================
  // Contact (15%)
  // ========================================

  // Phone (5%)
  if (agency.phone && agency.phone.trim().length > 0) {
    score += 5;
  }

  // Email (5%)
  if (agency.email && agency.email.trim().length > 0) {
    score += 5;
  }

  // Headquarters (5%)
  if (agency.headquarters && agency.headquarters.trim().length > 0) {
    score += 5;
  }

  // ========================================
  // Services (40%)
  // ========================================

  // Trades (20%) - Full credit if at least one trade is selected
  if (
    agency.trades &&
    Array.isArray(agency.trades) &&
    agency.trades.length > 0
  ) {
    score += 20;
  }

  // Regions (20%) - Full credit if at least one region is selected
  if (
    agency.regions &&
    Array.isArray(agency.regions) &&
    agency.regions.length > 0
  ) {
    score += 20;
  }

  // ========================================
  // Additional (15%)
  // ========================================

  // Logo (10%)
  if (agency.logo_url && agency.logo_url.trim().length > 0) {
    score += 10;
  }

  // Founded Year (5%)
  if (
    agency.founded_year &&
    agency.founded_year >= 1800 &&
    agency.founded_year <= new Date().getFullYear()
  ) {
    score += 5;
  }

  // ========================================
  // Details (10%)
  // ========================================

  // Employee Count (5%)
  if (agency.employee_count && agency.employee_count.trim().length > 0) {
    score += 5;
  }

  // Company Size (5%)
  if (agency.company_size && agency.company_size.trim().length > 0) {
    score += 5;
  }

  // Return score rounded to nearest integer
  return Math.round(score);
}
