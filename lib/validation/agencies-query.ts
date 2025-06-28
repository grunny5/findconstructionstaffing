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
    .pipe(z.array(z.string().trim().min(1)).max(API_CONSTANTS.MAX_TRADE_FILTERS, 'Too many trade filters'))
    .optional(),

  // State filters - array of 2-letter state codes  
  states: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => Array.isArray(val) ? val : [val])
    .pipe(z.array(z.string().trim().length(2, 'State code must be 2 letters')).max(API_CONSTANTS.MAX_STATE_FILTERS, 'Too many state filters'))
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
    
    // Parse URLSearchParams with support for array notation (key[])
    // First pass: collect all values, tracking which keys use array notation
    const values = new Map<string, string[]>();
    const hasArrayNotation = new Set<string>();
    
    for (const [key, value] of Array.from(searchParams.entries())) {
      const isArrayNotation = key.endsWith('[]');
      const cleanKey = isArrayNotation ? key.slice(0, -2) : key;
      
      if (isArrayNotation) {
        hasArrayNotation.add(cleanKey);
      }
      
      if (!values.has(cleanKey)) {
        values.set(cleanKey, []);
      }
      values.get(cleanKey)!.push(value);
    }
    
    // Second pass: build params object
    for (const [key, valueArray] of Array.from(values.entries())) {
      if (valueArray.length === 1 && !hasArrayNotation.has(key)) {
        // Single value without array notation
        params[key] = valueArray[0];
      } else {
        // Multiple values or uses array notation
        params[key] = valueArray;
      }
    }

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
 * 
 * This function removes potentially dangerous characters while preserving
 * valid search terms. It protects against:
 * - SQL injection attempts
 * - XSS attacks
 * - Command injection
 * - Path traversal
 */
export function sanitizeSearchInput(input: string): string {
  // First trim whitespace
  let sanitized = input.trim();
  
  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove SQL comment indicators before other processing
  sanitized = sanitized.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');
  
  // Remove common SQL/XSS keywords if they appear as whole words
  // This is done BEFORE removing special characters so we can catch
  // patterns like <script> before the brackets are removed
  const dangerousKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION',
    'EXEC', 'EXECUTE', 'SCRIPT', 'JAVASCRIPT', 'VBSCRIPT',
    'ONLOAD', 'ONERROR', 'ONCLICK', 'ALERT'
  ];
  
  const keywordRegex = new RegExp(
    `\\b(${dangerousKeywords.join('|')})\\b`,
    'gi'
  );
  sanitized = sanitized.replace(keywordRegex, '');
  
  // Remove characters commonly used in SQL injection and XSS
  // Keep alphanumeric, spaces, and common punctuation used in business names
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.,'&]/g, '');
  
  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Final trim
  sanitized = sanitized.trim();
  
  // Limit length to prevent DoS
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100).trim();
  }
  
  return sanitized;
}