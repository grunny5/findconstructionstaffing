// Type definitions for Supabase mocking
import type {
  PostgrestResponse,
  PostgrestError,
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
} from '@supabase/supabase-js';

// Enhance PostgrestError with all required properties
export interface MockPostgrestError extends PostgrestError {
  message: string;
  code: string;
  details: string;
  hint: string;
  name: string;
}

// Helper type for mock response
export type MockResponse<T> = {
  data: T | null;
  error: MockPostgrestError | null;
  count?: number | null;
  status?: number;
  statusText?: string;
};

// Helper to create a valid PostgrestError
export function createMockError(
  message: string,
  code: string = 'MOCK_ERROR',
  details: string = '',
  hint: string = ''
): MockPostgrestError {
  return {
    message,
    code,
    details,
    hint,
    name: 'PostgrestError',
  };
}

// Type guard for PostgrestError
export function isPostgrestError(error: any): error is PostgrestError {
  return error && typeof error.message === 'string' && typeof error.code === 'string';
}

// Create typed mock data helpers
export function createMockResponse<T>(
  data: T | null,
  error: MockPostgrestError | null = null,
  count?: number
): MockResponse<T> {
  return {
    data: error ? null : data,
    error,
    count: error ? null : count ?? null,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  };
}

// Helper for single responses
export function createMockSingleResponse<T>(
  data: T | null,
  error: MockPostgrestError | null = null
): PostgrestSingleResponse<T> {
  return {
    data: error ? null : data,
    error,
    count: null,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  };
}

// Helper for array responses
export function createMockArrayResponse<T>(
  data: T[] | null,
  error: MockPostgrestError | null = null,
  count?: number
): PostgrestResponse<T[]> {
  return {
    data: error ? null : data,
    error,
    count: error ? null : count ?? (data ? data.length : null),
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  };
}