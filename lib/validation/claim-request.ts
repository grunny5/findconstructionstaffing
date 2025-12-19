/**
 * Validation schemas for agency claim request API
 */

import { z } from 'zod';

/**
 * Verification method options for claim requests
 */
export const VerificationMethodEnum = z.enum(['email', 'phone', 'manual'], {
  errorMap: () => ({
    message:
      'Verification method must be one of: email, phone, or manual',
  }),
});

/**
 * Phone number validation pattern (E.164 format)
 * Matches international phone numbers starting with + and country code
 *
 * Examples:
 * - +1-555-123-4567
 * - +44 20 1234 5678
 * - +1 (555) 123-4567
 */
const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * More lenient phone number pattern that accepts common formats
 * This will be sanitized to E.164 format before storage
 * Matches: +1-555-123-4567, +44 20 1234 5678, +1 (555) 123-4567, etc.
 */
const PHONE_REGEX =
  /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{0,4}$/;

/**
 * Schema for validating claim request submission
 *
 * Validates all required fields for submitting an agency claim request.
 * Matches the database schema and FSD requirements.
 */
export const ClaimRequestSchema = z.object({
  // Agency being claimed (UUID)
  agency_id: z
    .string()
    .uuid({ message: 'Invalid agency ID format' })
    .min(1, 'Agency ID is required'),

  // Business email for verification
  business_email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Invalid email address format' })
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters'),

  // Phone number for contact/verification
  phone_number: z
    .string()
    .trim()
    .regex(PHONE_REGEX, {
      message:
        'Invalid phone number format. Use international format: +1-555-123-4567',
    })
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must be less than 20 characters'),

  // Position/title of the person claiming
  position_title: z
    .string()
    .trim()
    .min(2, 'Position title must be at least 2 characters')
    .max(100, 'Position title must be less than 100 characters'),

  // Preferred verification method
  verification_method: VerificationMethodEnum,

  // Optional additional notes
  additional_notes: z
    .string()
    .trim()
    .max(1000, 'Additional notes must be less than 1000 characters')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

/**
 * Type inference for claim request validation
 */
export type ClaimRequestInput = z.infer<typeof ClaimRequestSchema>;

/**
 * Schema for validating the claim request response
 */
export const ClaimRequestResponseSchema = z.object({
  id: z.string().uuid(),
  agency_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(['pending', 'under_review', 'approved', 'rejected']),
  email_domain_verified: z.boolean(),
  created_at: z.string(),
});

/**
 * Type inference for claim request response
 */
export type ClaimRequestResponse = z.infer<typeof ClaimRequestResponseSchema>;

/**
 * Error response schema for claim request API
 */
export const ClaimRequestErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
  }),
});

/**
 * Type inference for error response
 */
export type ClaimRequestError = z.infer<typeof ClaimRequestErrorSchema>;
