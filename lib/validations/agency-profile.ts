import * as z from 'zod';

// Employee count ranges for agency size
export const EMPLOYEE_COUNT_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '10-50', label: '10-50 employees' },
  { value: '50-100', label: '50-100 employees' },
  { value: '100-200', label: '100-200 employees' },
  { value: '200-500', label: '200-500 employees' },
  { value: '500-1000', label: '500-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
] as const;

// Generate year options from 1900 to current year
const currentYear = new Date().getFullYear();
export const FOUNDED_YEAR_OPTIONS = Array.from(
  { length: currentYear - 1899 },
  (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  })
);

/**
 * Validation schema for agency profile edit form
 *
 * Fields:
 * - name: Company name (2-200 chars) - requires admin approval if changed
 * - description: Rich text company description (max 2000 chars)
 * - website: Valid HTTP/HTTPS URL
 * - phone: E.164 format phone number
 * - email: Valid email address
 * - founded_year: Year between 1900 and current year
 * - employee_count: One of the predefined ranges
 * - headquarters: City/state location (max 200 chars)
 */
export const agencyProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must be less than 200 characters'),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .or(z.literal('')),

  website: z
    .string()
    .trim()
    .url('Must be a valid URL (http:// or https://)')
    .regex(/^https?:\/\/.+/, 'Website must start with http:// or https://')
    .optional()
    .or(z.literal('')),

  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Phone must be in E.164 format (e.g., +1234567890)'
    )
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .trim()
    .email('Must be a valid email address')
    .optional()
    .or(z.literal('')),

  founded_year: z
    .string()
    .regex(/^\d{4}$/, 'Must be a valid year')
    .refine(
      (year) => {
        const y = parseInt(year, 10);
        return y >= 1900 && y <= currentYear;
      },
      { message: `Year must be between 1900 and ${currentYear}` }
    )
    .optional()
    .or(z.literal('')),

  employee_count: z
    .enum([
      '1-10',
      '10-50',
      '50-100',
      '100-200',
      '200-500',
      '500-1000',
      '1000+',
    ])
    .optional()
    .or(z.literal('')),

  headquarters: z
    .string()
    .trim()
    .max(200, 'Headquarters must be less than 200 characters')
    .optional()
    .or(z.literal('')),
});

export type AgencyProfileFormData = z.infer<typeof agencyProfileSchema>;

/**
 * Helper to determine if name change requires admin approval
 */
export function requiresAdminApproval(
  originalName: string,
  newName: string
): boolean {
  return originalName.trim().toLowerCase() !== newName.trim().toLowerCase();
}

/**
 * Helper to count characters in HTML/rich text content
 * Strips HTML tags to get plain text character count
 */
export function getPlainTextLength(html: string): number {
  if (!html) return 0;

  // Create a temporary div to parse HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  // Get text content (strips HTML tags)
  return (tmp.textContent || tmp.innerText || '').length;
}
