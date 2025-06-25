/**
 * Test utilities for mocking Next.js API route objects
 */

import { NextRequest } from 'next/server';

/**
 * Creates a mock NextRequest object for testing API routes
 */
export function createMockNextRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  searchParams?: Record<string, string | string[]>;
} = {}): NextRequest {
  const {
    url = 'http://localhost:3000/api/test',
    method = 'GET',
    headers = {},
    searchParams = {}
  } = options;

  // Create URL with search params
  const testUrl = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => testUrl.searchParams.append(key, v));
    } else {
      testUrl.searchParams.set(key, value);
    }
  });

  // Create mock request
  const mockRequest = {
    url: testUrl.toString(),
    method,
    headers: new Headers(headers),
    nextUrl: testUrl,
    // Add minimal request properties needed for our tests
    json: jest.fn(),
    text: jest.fn(),
    formData: jest.fn(),
    clone: jest.fn()
  } as unknown as NextRequest;

  return mockRequest;
}

/**
 * Mock NextResponse for testing
 */
export const mockNextResponse = {
  json: jest.fn((data: any, init?: ResponseInit) => ({
    status: init?.status || 200,
    json: async () => data,
    headers: new Headers(init?.headers)
  })),
  error: jest.fn(() => ({
    status: 500,
    json: async () => ({ error: 'Internal Server Error' })
  }))
};

/**
 * Helper to extract response data from mocked NextResponse.json calls
 */
export async function extractResponseData(mockJsonCall: any) {
  const response = mockJsonCall.mock.results[mockJsonCall.mock.results.length - 1].value;
  return await response.json();
}

/**
 * Helper to get the status code from mocked NextResponse.json calls
 */
export function extractResponseStatus(mockJsonCall: any) {
  const response = mockJsonCall.mock.results[mockJsonCall.mock.results.length - 1].value;
  return response.status;
}

/**
 * Creates mock Supabase query chain for testing
 */
export function createMockSupabaseQuery(mockData: {
  data?: any;
  error?: any;
  count?: number;
} = {}) {
  const { data = [], error = null, count = 0 } = mockData;

  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    // Final resolve
    then: jest.fn().mockResolvedValue({ data, error, count }),
    // Direct await support
    [Symbol.toStringTag]: 'Promise'
  };
}

/**
 * Mock environment variables for testing
 */
export function mockEnvVars(vars: Record<string, string>) {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv, ...vars };
  });

  afterEach(() => {
    process.env = originalEnv;
  });
}