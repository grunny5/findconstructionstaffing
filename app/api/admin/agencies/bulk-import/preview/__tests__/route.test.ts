/**
 * Tests for Bulk Import Preview API Endpoint
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES, HTTP_STATUS } from '@/types/api';

jest.mock('@/lib/supabase/server');

const mockedCreateClient = jest.mocked(createClient);

const mockTrades = [
  { id: 'trade-1', name: 'Electrician', slug: 'electrician' },
  { id: 'trade-2', name: 'Welder', slug: 'welder' },
  { id: 'trade-3', name: 'Plumber', slug: 'plumber' },
];

const mockRegions = [
  { id: 'region-1', name: 'Texas', code: 'TX' },
  { id: 'region-2', name: 'California', code: 'CA' },
  { id: 'region-3', name: 'New York', code: 'NY' },
];

const mockExistingAgencies = [
  { name: 'Existing Agency One' },
  { name: 'Alpha Staffing' },
];

describe('POST /api/admin/agencies/bulk-import/preview', () => {
  let mockSupabaseClient: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
  };

  const createMockRequest = (body: unknown): NextRequest => {
    return new NextRequest(
      'http://localhost/api/admin/agencies/bulk-import/preview',
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  const setupAuthenticatedAdmin = () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-123', email: 'admin@example.com' } },
      error: null,
    });
  };

  const setupMockQueries = () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
        };
      }
      if (table === 'agencies') {
        return {
          select: jest.fn().mockResolvedValue({
            data: mockExistingAgencies,
            error: null,
          }),
        };
      }
      if (table === 'trades') {
        return {
          select: jest.fn().mockResolvedValue({
            data: mockTrades,
            error: null,
          }),
        };
      }
      if (table === 'regions') {
        return {
          select: jest.fn().mockResolvedValue({
            data: mockRegions,
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      auth: { getUser: jest.fn() },
      from: jest.fn(),
    };

    mockedCreateClient.mockResolvedValue(mockSupabaseClient as never);
  });

  // ========================================================================
  // AUTHENTICATION TESTS
  // ========================================================================

  describe('Authentication', () => {
    it('returns 401 if user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createMockRequest({ rows: [] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('returns 403 if user is not an admin', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      });

      const request = createMockRequest({ rows: [] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(data.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  // ========================================================================
  // REQUEST VALIDATION TESTS
  // ========================================================================

  describe('Request Validation', () => {
    beforeEach(() => {
      setupAuthenticatedAdmin();
      setupMockQueries();
    });

    it('returns 400 for invalid JSON', async () => {
      const request = new NextRequest(
        'http://localhost/api/admin/agencies/bulk-import/preview',
        {
          method: 'POST',
          body: 'not valid json',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('returns 400 if rows array is missing', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(data.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('accepts empty rows array', async () => {
      const request = createMockRequest({ rows: [] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rows).toEqual([]);
      expect(data.summary).toEqual({
        total: 0,
        valid: 0,
        invalid: 0,
        withWarnings: 0,
      });
    });
  });

  // ========================================================================
  // ROW VALIDATION TESTS
  // ========================================================================

  describe('Row Validation', () => {
    beforeEach(() => {
      setupAuthenticatedAdmin();
      setupMockQueries();
    });

    it('validates a valid row successfully', async () => {
      const request = createMockRequest({
        rows: [
          {
            name: 'New Agency',
            description: 'A great staffing agency',
            website: 'https://newagency.com',
            email: 'contact@newagency.com',
            phone: '+12345678900',
            _rowNumber: 2,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].errors).toEqual([]);
      expect(data.summary.valid).toBe(1);
      expect(data.summary.invalid).toBe(0);
    });

    it('returns error for missing name', async () => {
      const request = createMockRequest({
        rows: [{ _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors).toContain('Name is required');
    });

    it('returns error for empty name', async () => {
      const request = createMockRequest({
        rows: [{ name: '  ', _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors).toContain('Name is required');
    });

    it('returns error for name too short', async () => {
      const request = createMockRequest({
        rows: [{ name: 'A', _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors).toContain(
        'Name must be at least 2 characters'
      );
    });

    it('returns error for name too long', async () => {
      const request = createMockRequest({
        rows: [{ name: 'A'.repeat(201), _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors).toContain(
        'Name must be less than 200 characters'
      );
    });

    it('returns error for invalid website URL', async () => {
      const request = createMockRequest({
        rows: [{ name: 'Test Agency', website: 'not-a-url', _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors).toContain('Website must be a valid URL');
    });

    it('returns error for non-http/https website', async () => {
      const request = createMockRequest({
        rows: [
          { name: 'Test Agency', website: 'ftp://example.com', _rowNumber: 2 },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors).toContain(
        'Website must start with http:// or https://'
      );
    });

    it('returns error for invalid email', async () => {
      const request = createMockRequest({
        rows: [{ name: 'Test Agency', email: 'invalid-email', _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors).toContain(
        'Email must be a valid email address'
      );
    });

    it('returns error for invalid phone format', async () => {
      const request = createMockRequest({
        rows: [{ name: 'Test Agency', phone: '555-1234', _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors).toContain(
        'Phone must be in E.164 format (e.g., +12345678900)'
      );
    });

    it('returns error for invalid founded_year', async () => {
      const request = createMockRequest({
        rows: [{ name: 'Test Agency', founded_year: '1799', _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors[0]).toContain(
        'Founded year must be between 1800'
      );
    });

    it('returns error for future founded_year', async () => {
      const futureYear = new Date().getFullYear() + 1;
      const request = createMockRequest({
        rows: [
          {
            name: 'Test Agency',
            founded_year: String(futureYear),
            _rowNumber: 2,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors[0]).toContain('Founded year must be between');
    });

    it('returns error for description too long', async () => {
      const request = createMockRequest({
        rows: [
          { name: 'Test Agency', description: 'A'.repeat(5001), _rowNumber: 2 },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors).toContain(
        'Description must be less than 5000 characters'
      );
    });
  });

  // ========================================================================
  // NAME UNIQUENESS TESTS
  // ========================================================================

  describe('Name Uniqueness', () => {
    beforeEach(() => {
      setupAuthenticatedAdmin();
      setupMockQueries();
    });

    it('returns error for name that exists in database', async () => {
      const request = createMockRequest({
        rows: [{ name: 'Existing Agency One', _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors).toContain(
        'Agency with this name already exists in database'
      );
    });

    it('checks name uniqueness case-insensitively', async () => {
      const request = createMockRequest({
        rows: [{ name: 'EXISTING AGENCY ONE', _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(false);
      expect(data.rows[0].errors).toContain(
        'Agency with this name already exists in database'
      );
    });

    it('returns error for duplicate names within batch', async () => {
      const request = createMockRequest({
        rows: [
          { name: 'New Agency', _rowNumber: 2 },
          { name: 'New Agency', _rowNumber: 3 },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[1].valid).toBe(false);
      expect(data.rows[1].errors).toContain(
        'Duplicate name in upload (first appears in row 2)'
      );
    });

    it('detects case-insensitive duplicates within batch', async () => {
      const request = createMockRequest({
        rows: [
          { name: 'Test Agency', _rowNumber: 2 },
          { name: 'TEST AGENCY', _rowNumber: 3 },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[1].valid).toBe(false);
      expect(data.rows[1].errors[0]).toContain('Duplicate name in upload');
    });
  });

  // ========================================================================
  // TRADES VALIDATION TESTS
  // ========================================================================

  describe('Trades Validation', () => {
    beforeEach(() => {
      setupAuthenticatedAdmin();
      setupMockQueries();
    });

    it('accepts valid trade names', async () => {
      const request = createMockRequest({
        rows: [
          {
            name: 'Test Agency',
            trades: ['Electrician', 'Welder'],
            _rowNumber: 2,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].warnings).toEqual([]);
    });

    it('accepts trade names case-insensitively', async () => {
      const request = createMockRequest({
        rows: [
          {
            name: 'Test Agency',
            trades: ['ELECTRICIAN', 'welder'],
            _rowNumber: 2,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].warnings).toEqual([]);
    });

    it('accepts trade slugs', async () => {
      const request = createMockRequest({
        rows: [
          {
            name: 'Test Agency',
            trades: ['electrician', 'plumber'],
            _rowNumber: 2,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].warnings).toEqual([]);
    });

    it('returns warning for unknown trades', async () => {
      const request = createMockRequest({
        rows: [
          {
            name: 'Test Agency',
            trades: ['Electrician', 'Unknown Trade', 'Another Unknown'],
            _rowNumber: 2,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].warnings[0]).toContain(
        'Unknown trades will be skipped'
      );
      expect(data.rows[0].warnings[0]).toContain('Unknown Trade');
      expect(data.rows[0].warnings[0]).toContain('Another Unknown');
    });
  });

  // ========================================================================
  // REGIONS VALIDATION TESTS
  // ========================================================================

  describe('Regions Validation', () => {
    beforeEach(() => {
      setupAuthenticatedAdmin();
      setupMockQueries();
    });

    it('accepts valid region codes', async () => {
      const request = createMockRequest({
        rows: [
          { name: 'Test Agency', regions: ['TX', 'CA', 'NY'], _rowNumber: 2 },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].warnings).toEqual([]);
    });

    it('accepts region codes case-insensitively', async () => {
      const request = createMockRequest({
        rows: [{ name: 'Test Agency', regions: ['tx', 'ca'], _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].warnings).toEqual([]);
    });

    it('accepts region names', async () => {
      const request = createMockRequest({
        rows: [
          {
            name: 'Test Agency',
            regions: ['Texas', 'California'],
            _rowNumber: 2,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].warnings).toEqual([]);
    });

    it('returns warning for unknown regions', async () => {
      const request = createMockRequest({
        rows: [
          {
            name: 'Test Agency',
            regions: ['TX', 'ZZ', 'Unknown'],
            _rowNumber: 2,
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].warnings[0]).toContain(
        'Unknown regions will be skipped'
      );
      expect(data.rows[0].warnings[0]).toContain('ZZ');
      expect(data.rows[0].warnings[0]).toContain('Unknown');
    });
  });

  // ========================================================================
  // WARNINGS TESTS
  // ========================================================================

  describe('Warnings', () => {
    beforeEach(() => {
      setupAuthenticatedAdmin();
      setupMockQueries();
    });

    it('returns warning for non-standard employee_count', async () => {
      const request = createMockRequest({
        rows: [{ name: 'Test Agency', employee_count: '15', _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].warnings[0]).toContain('Employee count');
      expect(data.rows[0].warnings[0]).toContain('not a standard value');
    });

    it('returns warning for non-standard company_size', async () => {
      const request = createMockRequest({
        rows: [{ name: 'Test Agency', company_size: 'Huge', _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].warnings[0]).toContain('Company size');
      expect(data.rows[0].warnings[0]).toContain('not a standard value');
    });

    it('accepts standard employee_count values without warning', async () => {
      const request = createMockRequest({
        rows: [
          { name: 'Test Agency', employee_count: '51-100', _rowNumber: 2 },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].warnings).toEqual([]);
    });

    it('accepts standard company_size values without warning', async () => {
      const request = createMockRequest({
        rows: [{ name: 'Test Agency', company_size: 'Medium', _rowNumber: 2 }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rows[0].valid).toBe(true);
      expect(data.rows[0].warnings).toEqual([]);
    });
  });

  // ========================================================================
  // SUMMARY TESTS
  // ========================================================================

  describe('Summary', () => {
    beforeEach(() => {
      setupAuthenticatedAdmin();
      setupMockQueries();
    });

    it('calculates summary correctly', async () => {
      const request = createMockRequest({
        rows: [
          { name: 'Valid Agency 1', _rowNumber: 2 },
          { name: 'Valid Agency 2', trades: ['Unknown Trade'], _rowNumber: 3 },
          { name: '', _rowNumber: 4 }, // Invalid - no name
          { name: 'Existing Agency One', _rowNumber: 5 }, // Invalid - duplicate
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.summary).toEqual({
        total: 4,
        valid: 2,
        invalid: 2,
        withWarnings: 1,
      });
    });

    it('handles all valid rows', async () => {
      const request = createMockRequest({
        rows: [
          { name: 'Valid Agency 1', _rowNumber: 2 },
          { name: 'Valid Agency 2', _rowNumber: 3 },
          { name: 'Valid Agency 3', _rowNumber: 4 },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.summary.valid).toBe(3);
      expect(data.summary.invalid).toBe(0);
    });

    it('handles all invalid rows', async () => {
      const request = createMockRequest({
        rows: [
          { _rowNumber: 2 }, // No name
          { name: 'A', _rowNumber: 3 }, // Name too short
          { name: 'Existing Agency One', _rowNumber: 4 }, // Duplicate
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.summary.valid).toBe(0);
      expect(data.summary.invalid).toBe(3);
    });
  });

  // ========================================================================
  // LARGE BATCH TESTS
  // ========================================================================

  describe('Large Batches', () => {
    beforeEach(() => {
      setupAuthenticatedAdmin();
      setupMockQueries();
    });

    it('handles 100 rows', async () => {
      const rows = Array.from({ length: 100 }, (_, i) => ({
        name: `Agency ${i + 1}`,
        _rowNumber: i + 2,
      }));

      const request = createMockRequest({ rows });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rows).toHaveLength(100);
      expect(data.summary.total).toBe(100);
      expect(data.summary.valid).toBe(100);
    });
  });

  // ========================================================================
  // DATABASE ERROR TESTS
  // ========================================================================

  describe('Database Errors', () => {
    beforeEach(() => {
      setupAuthenticatedAdmin();
    });

    it('returns 500 if agencies query fails', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const request = createMockRequest({
        rows: [{ name: 'Test', _rowNumber: 2 }],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });

    it('returns 500 if trades query fails', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockExistingAgencies,
              error: null,
            }),
          };
        }
        if (table === 'trades') {
          return {
            select: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const request = createMockRequest({
        rows: [{ name: 'Test', _rowNumber: 2 }],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });
  });

  // ========================================================================
  // NO DATA CREATION TESTS
  // ========================================================================

  describe('No Data Creation', () => {
    beforeEach(() => {
      setupAuthenticatedAdmin();
      setupMockQueries();
    });

    it('does not call insert on agencies table', async () => {
      const mockInsert = jest.fn();

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockExistingAgencies,
              error: null,
            }),
            insert: mockInsert,
          };
        }
        if (table === 'trades') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockTrades,
              error: null,
            }),
          };
        }
        if (table === 'regions') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockRegions,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
          insert: mockInsert,
        };
      });

      const request = createMockRequest({
        rows: [
          { name: 'Valid Agency', _rowNumber: 2 },
          { name: 'Another Valid Agency', _rowNumber: 3 },
        ],
      });

      await POST(request);

      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
});
