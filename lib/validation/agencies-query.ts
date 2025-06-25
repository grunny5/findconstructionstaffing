/**
 * Validation schemas for agencies API query parameters
 */

import { z } from 'zod';
import { API_CONSTANTS } from '@/types/api';

/**
 * Schema for validating agencies API query parameters
 */
export const AgenciesQuerySchema = z.object({
  // Search parameter - optional string with trimming and length validation
  search: z
    .string()
    .trim()
    .min(1, 'Search term must be at least 1 character')
    .max(100, 'Search term must be less than 100 characters')
    .optional()
    .transform((val) => val === '' ? undefined : val),

  // Trade filters - array of trade slugs
  trades: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => Array.isArray(val) ? val : [val])
    .pipe(z.array(z.string().trim().min(1)).max(10, 'Too many trade filters'))
    .optional(),

  // State filters - array of 2-letter state codes  
  states: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => Array.isArray(val) ? val : [val])
    .pipe(z.array(z.string().trim().length(2, 'State code must be 2 letters')).max(10, 'Too many state filters'))
    .optional(),

  // Pagination parameters
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : API_CONSTANTS.DEFAULT_LIMIT)
    .pipe(z.number().int().min(1).max(API_CONSTANTS.MAX_LIMIT)),

  offset: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : API_CONSTANTS.DEFAULT_OFFSET)
    .pipe(z.number().int().min(0))
});

export type ValidatedAgenciesQuery = z.infer<typeof AgenciesQuerySchema>;

/**
 * Parse and validate query parameters from URL search params
 */
export function parseAgenciesQuery(searchParams: URLSearchParams): {
  success: true;
  data: ValidatedAgenciesQuery;
} | {
  success: false;
  error: z.ZodError;
} {
  try {
    // Convert URLSearchParams to object for Zod validation
    const params: Record<string, string | string[]> = {};
    
    searchParams.forEach((value, key) => {
      // Handle array parameters (trades[], states[])
      if (key.endsWith('[]')) {
        const baseKey = key.slice(0, -2);
        if (!params[baseKey]) {
          params[baseKey] = [];
        }
        if (Array.isArray(params[baseKey])) {
          (params[baseKey] as string[]).push(value);
        }
      } else {
        // Handle single parameters
        if (params[key]) {
          // Convert to array if we see the same key multiple times
          if (!Array.isArray(params[key])) {
            params[key] = [params[key] as string];
          }
          (params[key] as string[]).push(value);
        } else {
          params[key] = value;
        }
      }
    });

    const result = AgenciesQuerySchema.parse(params);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Sanitize search input to prevent injection attacks
 */
export function sanitizeSearchInput(input: string): string {
  return input
    .trim()
    // Remove potentially dangerous characters
    .replace(/[<>\"'&]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace again
    .trim();
}