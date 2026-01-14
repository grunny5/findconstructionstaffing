import * as z from 'zod';

// =============================================================================
// CONSTANTS
// =============================================================================

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 5000;
export const HEADQUARTERS_MAX_LENGTH = 200;
export const MIN_FOUNDED_YEAR = 1800;

// Maximum founded year - dynamically calculated when needed
export const MAX_FOUNDED_YEAR = () => new Date().getFullYear();

// Employee count ranges
export const EMPLOYEE_COUNT_VALUES = [
  '1-10',
  '11-50',
  '51-100',
  '101-200',
  '201-500',
  '501-1000',
  '1001+',
] as const;

export const EMPLOYEE_COUNT_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-100', label: '51-100 employees' },
  { value: '101-200', label: '101-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001+', label: '1001+ employees' },
] as const;

// Company size options
export const COMPANY_SIZE_VALUES = [
  'Small',
  'Medium',
  'Large',
  'Enterprise',
] as const;

export const COMPANY_SIZE_OPTIONS = [
  { value: 'Small', label: 'Small' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Large', label: 'Large' },
  { value: 'Enterprise', label: 'Enterprise' },
] as const;

// Generate year options from current year down to MIN_FOUNDED_YEAR
export function getFoundedYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - MIN_FOUNDED_YEAR + 1 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));
}

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

/**
 * Validation schema for agency creation/editing
 *
 * Fields:
 * - name: Required, 2-200 characters, trimmed
 * - description: Optional, max 5000 characters
 * - website: Optional, valid HTTP/HTTPS URL
 * - phone: Optional, E.164 format (e.g., +12345678900 or 12345678900)
 * - email: Optional, valid email address
 * - headquarters: Optional, max 200 characters
 * - founded_year: Optional, year as string, 1800-current year
 * - employee_count: Optional, predefined ranges
 * - company_size: Optional, Small/Medium/Large/Enterprise
 * - offers_per_diem: Boolean, defaults to false
 * - is_union: Boolean, defaults to false
 * - verified: Boolean, defaults to false (admin-only, shows badge on homepage)
 *
 * Note: founded_year is a string for form compatibility but should be
 * converted to integer before database storage.
 */
export const agencyCreationSchema = z.object({
  name: z
    .string({ required_error: 'Company name is required' })
    .trim()
    .min(
      NAME_MIN_LENGTH,
      `Company name must be at least ${NAME_MIN_LENGTH} characters`
    )
    .max(
      NAME_MAX_LENGTH,
      `Company name must be less than ${NAME_MAX_LENGTH} characters`
    ),

  description: z
    .string()
    .trim()
    .max(
      DESCRIPTION_MAX_LENGTH,
      `Description must be less than ${DESCRIPTION_MAX_LENGTH} characters`
    )
    .optional()
    .or(z.literal('')),

  website: z
    .string()
    .trim()
    .url('Must be a valid URL (e.g., https://example.com)')
    .regex(/^https?:\/\/.+/, 'Website must start with http:// or https://')
    .optional()
    .or(z.literal('')),

  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Phone must be in E.164 format (e.g., +12345678900 or 12345678900)'
    )
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .trim()
    .email('Must be a valid email address')
    .optional()
    .or(z.literal('')),

  headquarters: z
    .string()
    .trim()
    .max(
      HEADQUARTERS_MAX_LENGTH,
      `Headquarters must be less than ${HEADQUARTERS_MAX_LENGTH} characters`
    )
    .optional()
    .or(z.literal('')),

  founded_year: z
    .string()
    .regex(/^\d{4}$/, 'Must be a valid 4-digit year')
    .refine(
      (year) => {
        const currentYear = new Date().getFullYear();
        const y = parseInt(year, 10);
        return y >= MIN_FOUNDED_YEAR && y <= currentYear;
      },
      {
        message: `Year must be between ${MIN_FOUNDED_YEAR} and ${new Date().getFullYear()}`,
      }
    )
    .optional()
    .or(z.literal('')),

  employee_count: z
    .union([
      z.enum(EMPLOYEE_COUNT_VALUES, {
        errorMap: () => ({
          message: `Employee count must be one of: ${EMPLOYEE_COUNT_VALUES.join(', ')}`,
        }),
      }),
      z.literal(''),
    ])
    .optional(),

  company_size: z
    .union([
      z.enum(COMPANY_SIZE_VALUES, {
        errorMap: () => ({
          message: `Company size must be one of: ${COMPANY_SIZE_VALUES.join(', ')}`,
        }),
      }),
      z.literal(''),
    ])
    .optional(),

  offers_per_diem: z.boolean().default(false),

  is_union: z.boolean().default(false),

  verified: z.boolean().default(false),
});

export type AgencyCreationFormData = z.infer<typeof agencyCreationSchema>;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert founded_year string to integer for database storage
 * Returns null if the value is empty or invalid
 */
export function parseFoundedYear(value: string | undefined): number | null {
  if (!value || value === '') return null;
  const year = parseInt(value, 10);
  if (isNaN(year)) return null;
  return year;
}

/**
 * Convert empty string fields to null for database storage
 * Database expects null for optional fields, not empty strings
 */
export function normalizeOptionalString(
  value: string | undefined
): string | null {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

/**
 * Prepare agency data for database insertion
 * Converts form data to database-ready format
 */
export function prepareAgencyDataForDatabase(data: AgencyCreationFormData) {
  return {
    name: data.name,
    description: normalizeOptionalString(data.description),
    website: normalizeOptionalString(data.website),
    phone: normalizeOptionalString(data.phone),
    email: normalizeOptionalString(data.email),
    headquarters: normalizeOptionalString(data.headquarters),
    founded_year: parseFoundedYear(data.founded_year),
    employee_count: normalizeOptionalString(data.employee_count),
    company_size: normalizeOptionalString(data.company_size),
    offers_per_diem: data.offers_per_diem,
    is_union: data.is_union,
    verified: data.verified,
  };
}

/**
 * Validate agency name length
 * @param name - Name to validate
 * @returns true if valid, false otherwise
 */
export function isValidAgencyName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= NAME_MIN_LENGTH && trimmed.length <= NAME_MAX_LENGTH;
}

/**
 * Validate E.164 phone format
 * @param phone - Phone number to validate
 * @returns true if valid E.164 format (with optional + prefix), false otherwise
 */
export function isValidE164Phone(phone: string): boolean {
  if (!phone || phone.trim() === '') return true; // Optional field
  return /^\+?[1-9]\d{1,14}$/.test(phone.trim());
}

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns true if valid http/https URL, false otherwise
 */
export function isValidWebsiteUrl(url: string): boolean {
  if (!url || url.trim() === '') return true; // Optional field
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
