/**
 * Test utilities for mocking Next.js API route objects
 */

import { NextRequest } from 'next/server';

/**
 * Creates a mock NextRequest object for testing API routes
 *
 * Note: NextRequest has internal properties that are not easily mockable.
 * This function creates a partial mock with all the properties typically used
 * in API route handlers, providing type safety for the most common use cases.
 */
export function createMockNextRequest(
  options: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    searchParams?: Record<string, string | string[]>;
  } = {}
): NextRequest {
  const {
    url = 'http://localhost:3000/api/test',
    method = 'GET',
    headers = {},
    searchParams = {},
  } = options;

  // Create URL with search params
  const testUrl = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => testUrl.searchParams.append(key, v));
    } else {
      testUrl.searchParams.set(key, value);
    }
  });

  // Create headers that are compatible with Headers interface
  const mockHeaders = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    mockHeaders.set(key, value);
  });

  // Create a base request object
  const baseRequest = new Request(testUrl.toString(), {
    method,
    headers: mockHeaders,
  });

  // Create mock NextURL object
  const mockNextUrl = {
    // URL properties
    href: testUrl.href,
    origin: testUrl.origin,
    protocol: testUrl.protocol,
    username: testUrl.username,
    password: testUrl.password,
    host: testUrl.host,
    hostname: testUrl.hostname,
    port: testUrl.port,
    pathname: testUrl.pathname,
    search: testUrl.search,
    searchParams: testUrl.searchParams,
    hash: testUrl.hash,
    // NextURL specific properties
    basePath: '',
    buildId: 'test-build-id',
    defaultLocale: 'en',
    domainLocale: undefined,
    locale: 'en',
    // Methods
    toString: () => testUrl.toString(),
    toJSON: () => testUrl.toJSON(),
    analyze: jest.fn(),
    formatPathname: jest.fn(),
    formatSearch: jest.fn(),
  };

  // Create the mock request with NextRequest-specific properties
  const mockRequest = Object.assign(baseRequest, {
    nextUrl: mockNextUrl,
    cookies: {
      get: jest.fn(),
      getAll: jest.fn().mockReturnValue([]),
      has: jest.fn().mockReturnValue(false),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    },
    geo: undefined,
    ip: undefined,
    ua: undefined,
    page: undefined,
    // Internal symbols that NextRequest expects
    [Symbol.for('NextInternalRequestMeta')]: {
      __NEXT_INIT_URL: testUrl.toString(),
      __NEXT_INIT_HEADERS: headers,
    },
  });

  // Override body reading methods with mocks
  mockRequest.json = jest.fn().mockResolvedValue({});
  mockRequest.text = jest.fn().mockResolvedValue('');
  mockRequest.formData = jest.fn().mockResolvedValue(new FormData());
  mockRequest.blob = jest.fn().mockResolvedValue(new Blob());
  mockRequest.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));

  return mockRequest as unknown as NextRequest;
}

/**
 * Mock NextResponse for testing
 */
export const mockNextResponse = {
  json: jest.fn((data: any, init?: ResponseInit) => ({
    status: init?.status || 200,
    json: async () => data,
    headers: new Headers(init?.headers),
  })),
  error: jest.fn(() => ({
    status: 500,
    json: async () => ({ error: 'Internal Server Error' }),
  })),
};

/**
 * Helper to extract response data from mocked NextResponse.json calls
 */
export async function extractResponseData(mockJsonCall: any) {
  if (
    !mockJsonCall.mock.results ||
    !Array.isArray(mockJsonCall.mock.results) ||
    mockJsonCall.mock.results.length === 0
  ) {
    throw new Error(
      'No mock results available. Ensure the mock function was called before extracting response data.'
    );
  }

  const lastResult =
    mockJsonCall.mock.results[mockJsonCall.mock.results.length - 1];
  if (!lastResult || !lastResult.value) {
    throw new Error(
      'Mock result is invalid or has no value. Check your test setup.'
    );
  }

  const response = lastResult.value;
  if (typeof response.json !== 'function') {
    throw new Error(
      'Mock response does not have a json() method. Ensure you are mocking NextResponse.json correctly.'
    );
  }

  return await response.json();
}

/**
 * Helper to get the status code from mocked NextResponse.json calls
 */
export function extractResponseStatus(mockJsonCall: any): number {
  if (
    !mockJsonCall.mock.results ||
    !Array.isArray(mockJsonCall.mock.results) ||
    mockJsonCall.mock.results.length === 0
  ) {
    throw new Error(
      'No mock results available. Ensure the mock function was called before extracting response status.'
    );
  }

  const lastResult =
    mockJsonCall.mock.results[mockJsonCall.mock.results.length - 1];
  if (!lastResult || !lastResult.value) {
    throw new Error(
      'Mock result is invalid or has no value. Check your test setup.'
    );
  }

  const response = lastResult.value;
  if (typeof response.status === 'undefined') {
    throw new Error(
      'Mock response does not have a status property. Ensure you are mocking NextResponse.json correctly.'
    );
  }

  return response.status;
}

/**
 * Creates mock Supabase query chain for testing
 */
export function createMockSupabaseQuery(
  mockData: {
    data?: any;
    error?: any;
    count?: number;
  } = {}
) {
  const { data = [], error = null, count = 0 } = mockData;

  // Create the mock query object with chainable methods
  const mockQuery = {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    ilike: jest.fn(),
    or: jest.fn(),
    range: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
  };

  // Create a promise that resolves with the mock data
  const resultPromise = Promise.resolve({ data, error, count });

  // Make all methods return the promise for proper chaining
  Object.keys(mockQuery).forEach((key) => {
    mockQuery[key] = jest.fn(() => resultPromise);
  });

  // Return the promise directly for final resolution
  return Object.assign(resultPromise, mockQuery);
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
