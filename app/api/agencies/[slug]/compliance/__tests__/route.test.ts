/**
 * @jest-environment node
 */

/**
 * Tests for GET /api/agencies/[slug]/compliance
 */

import { createMockNextRequest } from '@/__tests__/utils/api-mocks';
import { supabase } from '@/lib/supabase';
import { HTTP_STATUS, ERROR_CODES } from '@/types/api';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: unknown, init?: ResponseInit) => {
      const headers = new Map(Object.entries(init?.headers || {}));
      return {
        status: init?.status || 200,
        json: async () => data,
        headers: {
          get: (key: string) => headers.get(key) || null,
          set: (key: string, value: string) => headers.set(key, value),
        },
      };
    }),
  },
  NextRequest: jest.requireActual('next/server').NextRequest,
}));

// Import route after mocks are set up
import { GET } from '../route';

describe('GET /api/agencies/[slug]/compliance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (slug: string = 'test-agency') => {
    return createMockNextRequest({
      url: `http://localhost:3000/api/agencies/${slug}/compliance`,
    });
  };

  const createContext = (slug: string = 'test-agency') => ({
    params: Promise.resolve({ slug }),
  });

  describe('Success cases', () => {
    it('returns compliance items for agency with active compliance', async () => {
      // Configure mock for agency lookup followed by compliance lookup
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'agency-123' },
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'comp-1',
                  agency_id: 'agency-123',
                  compliance_type: 'osha_certified',
                  is_active: true,
                  is_verified: true,
                  verified_by: 'admin-123',
                  verified_at: '2025-01-01T00:00:00Z',
                  document_url: 'https://storage/doc.pdf',
                  expiration_date: '2026-12-31',
                  notes: null,
                  created_at: '2025-01-01T00:00:00Z',
                  updated_at: '2025-01-01T00:00:00Z',
                },
                {
                  id: 'comp-2',
                  agency_id: 'agency-123',
                  compliance_type: 'workers_comp',
                  is_active: true,
                  is_verified: false,
                  verified_by: null,
                  verified_at: null,
                  document_url: null,
                  expiration_date: null,
                  notes: null,
                  created_at: '2025-01-01T00:00:00Z',
                  updated_at: '2025-01-01T00:00:00Z',
                },
              ],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const response = await GET(createRequest(), createContext());
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.data).toHaveLength(2);
      expect(json.data[0]).toEqual({
        type: 'osha_certified',
        displayName: 'OSHA Certified',
        isVerified: true,
        expirationDate: '2026-12-31',
        isExpired: false,
      });
      expect(json.data[1]).toEqual({
        type: 'workers_comp',
        displayName: "Workers' Compensation",
        isVerified: false,
        expirationDate: null,
        isExpired: false,
      });
    });

    it('returns empty array when agency has no active compliance', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'agency-123' },
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const response = await GET(createRequest(), createContext());
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.data).toEqual([]);
    });

    it('returns isExpired=true for expired compliance', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'agency-123' },
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'comp-1',
                  agency_id: 'agency-123',
                  compliance_type: 'general_liability',
                  is_active: true,
                  is_verified: true,
                  verified_by: null,
                  verified_at: null,
                  document_url: null,
                  expiration_date: pastDate.toISOString().split('T')[0],
                  notes: null,
                  created_at: '2025-01-01T00:00:00Z',
                  updated_at: '2025-01-01T00:00:00Z',
                },
              ],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const response = await GET(createRequest(), createContext());
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.data[0].isExpired).toBe(true);
    });

    it('includes cache headers in response', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'agency-123' },
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const response = await GET(createRequest(), createContext());

      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=300, stale-while-revalidate=60'
      );
    });
  });

  describe('Error cases', () => {
    it('returns 404 when agency not found', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const response = await GET(
        createRequest('non-existent'),
        createContext('non-existent')
      );
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(json.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(json.error.message).toBe('Agency not found');
    });

    it('returns 500 when database error occurs fetching compliance', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'agency-123' },
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST500', message: 'Database error' },
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const response = await GET(createRequest(), createContext());
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(json.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });
  });

  describe('Query behavior', () => {
    it('queries the correct tables', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'agency-123' },
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await GET(createRequest(), createContext());

      // Verify both tables were queried
      expect(supabase.from).toHaveBeenCalledWith('agencies');
      expect(supabase.from).toHaveBeenCalledWith('agency_compliance');
    });
  });
});
