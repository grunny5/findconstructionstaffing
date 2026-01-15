import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// =============================================================================
// FIELD-LEVEL VALIDATORS
// =============================================================================

/**
 * Validates email format
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(100, 'Email must be less than 100 characters')
  .toLowerCase()
  .trim();

/**
 * Validates phone number in North American format
 * Accepts: (555) 123-4567, 555-123-4567, 5551234567, +1 555 123 4567
 */
export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number must be less than 20 characters')
  .trim()
  .refine(
    (value) => {
      const phoneNumber = parsePhoneNumberFromString(value, 'US');
      return phoneNumber?.isValid() ?? false;
    },
    { message: 'Invalid phone number' }
  );

/**
 * Validates company name
 */
export const companyNameSchema = z
  .string()
  .min(2, 'Company name must be at least 2 characters')
  .max(200, 'Company name must be less than 200 characters')
  .trim();

/**
 * Validates project name
 */
export const projectNameSchema = z
  .string()
  .min(3, 'Project name must be at least 3 characters')
  .max(200, 'Project name must be less than 200 characters')
  .trim();

/**
 * Validates additional details/notes
 */
export const additionalDetailsSchema = z
  .string()
  .max(2000, 'Additional details must be less than 2000 characters')
  .trim()
  .optional();

/**
 * Validates craft notes
 */
export const craftNotesSchema = z
  .string()
  .max(500, 'Notes must be less than 500 characters')
  .trim()
  .optional();

// =============================================================================
// CRAFT REQUIREMENT SCHEMA
// =============================================================================

/**
 * Schema for a single craft requirement within a labor request
 */
export const craftFormDataSchema = z
  .object({
    tradeId: z.string().uuid('Invalid trade ID'),
    experienceLevel: z.enum(
      [
        'Helper',
        'Apprentice',
        'Journeyman',
        'Foreman',
        'General Foreman',
        'Superintendent',
        'Project Manager',
      ],
      {
        errorMap: () => ({ message: 'Invalid experience level' }),
      }
    ),
    regionId: z.string().uuid('Invalid region ID'),
    workerCount: z
      .number()
      .int('Worker count must be a whole number')
      .min(1, 'Must request at least 1 worker')
      .max(500, 'Cannot request more than 500 workers'),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .refine(
        (date) => {
          const startDate = new Date(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return startDate >= today;
        },
        { message: 'Start date cannot be in the past' }
      )
      .refine(
        (date) => {
          const startDate = new Date(date);
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          return startDate <= oneYearFromNow;
        },
        { message: 'Start date cannot be more than 1 year in the future' }
      ),
    durationDays: z
      .number()
      .int('Duration must be a whole number')
      .min(1, 'Duration must be at least 1 day')
      .max(365, 'Duration cannot exceed 365 days'),
    hoursPerWeek: z
      .number()
      .int('Hours per week must be a whole number')
      .min(1, 'Hours per week must be at least 1')
      .max(168, 'Hours per week cannot exceed 168 (24 hours × 7 days)'),
    notes: craftNotesSchema,
    payRateMin: z
      .number()
      .positive('Pay rate must be positive')
      .max(1000, 'Pay rate cannot exceed $1000/hour')
      .optional(),
    payRateMax: z
      .number()
      .positive('Pay rate must be positive')
      .max(1000, 'Pay rate cannot exceed $1000/hour')
      .optional(),
    perDiemRate: z
      .number()
      .positive('Per diem must be positive')
      .max(1000, 'Per diem cannot exceed $1000/day')
      .optional(),
  })
  .refine(
    (data) => {
      // If one pay rate is provided, both must be provided
      if (
        (data.payRateMin !== undefined && data.payRateMax === undefined) ||
        (data.payRateMin === undefined && data.payRateMax !== undefined)
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Both minimum and maximum pay rates must be provided together',
      path: ['payRateMin'],
    }
  )
  .refine(
    (data) => {
      // If both pay rates are provided, min must be <= max
      if (
        data.payRateMin !== undefined &&
        data.payRateMax !== undefined &&
        data.payRateMin > data.payRateMax
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Minimum pay rate must be less than or equal to maximum',
      path: ['payRateMin'],
    }
  );

// =============================================================================
// LABOR REQUEST SUBMISSION SCHEMA
// =============================================================================

/**
 * Complete labor request form validation schema
 * Validates the entire multi-craft labor request submission
 */
export const laborRequestFormDataSchema = z.object({
  projectName: projectNameSchema,
  companyName: companyNameSchema,
  contactEmail: emailSchema,
  contactPhone: phoneSchema,
  additionalDetails: additionalDetailsSchema,
  crafts: z
    .array(craftFormDataSchema)
    .min(1, 'At least one craft requirement is required')
    .max(10, 'Cannot request more than 10 crafts per submission')
    .refine(
      (crafts) => {
        // Ensure no duplicate trade/region combinations
        const seen = new Set<string>();
        for (const craft of crafts) {
          const key = `${craft.tradeId}:${craft.regionId}`;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
        }
        return true;
      },
      {
        message:
          'Each trade and region combination must be unique within a request',
      }
    ),
});

// =============================================================================
// TYPE INFERENCE
// =============================================================================

export type CraftFormData = z.infer<typeof craftFormDataSchema>;
export type LaborRequestFormData = z.infer<typeof laborRequestFormDataSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validates a single craft requirement
 * @returns Validation result with typed data or errors
 */
export function validateCraft(data: unknown) {
  return craftFormDataSchema.safeParse(data);
}

/**
 * Validates a complete labor request submission
 * @returns Validation result with typed data or errors
 */
export function validateLaborRequest(data: unknown) {
  return laborRequestFormDataSchema.safeParse(data);
}

/**
 * Formats Zod validation errors for user display
 * @param error Zod validation error
 * @returns Formatted error messages grouped by field
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}
