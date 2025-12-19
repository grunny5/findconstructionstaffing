/**
 * @jest-environment node
 */
import { GET } from '@/app/api/agencies/[slug]/route';
import { Agency } from '@/types/api';

// Mock Supabase before any imports
jest.mock('@/lib/supabase', () => {
  const mockFrom = jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  }));

  return {
    supabase: {
      from: mockFrom,
      _error: true, // Signal this is a mock to the API code
    },
  };
});

const mockAgency: Agency = {
  id: '1',
  name: 'Elite Construction Staffing',
  slug: 'elite-construction-staffing',
  description: 'Premier construction staffing',
  logo_url: 'https://example.com/logo.png',
  website: 'https://elitestaffing.com',
  phone: '555-0100',
  email: 'contact@elitestaffing.com',
  is_claimed: true,
  offers_per_diem: true,
  is_union: false,
  founded_year: 2010,
  employee_count: '50-100',
  headquarters: 'Dallas, TX',
  rating: 4.5,
  review_count: 25,
  project_count: 150,
  verified: true,
  featured: true,
  profile_completion_percentage: 95,
  last_edited_at: '2024-01-01T00:00:00Z',
  last_edited_by: '123e4567-e89b-12d3-a456-426614174000',
  trades: [{ id: 't1', name: 'Electricians', slug: 'electricians' }],
  regions: [{ id: 'r1', name: 'Texas', code: 'TX' }],
};

describe('Agency Profile Page API Tests', () => {
  const { supabase } = require('@/lib/supabase');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch agency by slug successfully', async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          ...mockAgency,
          agency_trades: [
            {
              trade: { id: 't1', name: 'Electricians', slug: 'electricians' },
            },
          ],
          agency_regions: [
            {
              region: {
                id: 'r1',
                name: 'Texas',
                state_code: 'TX',
                slug: 'texas',
              },
            },
          ],
        },
        error: null,
      }),
    };

    supabase.from.mockReturnValue(mockQueryBuilder);

    const request = new Request(
      'http://localhost:3000/api/agencies/elite-construction-staffing'
    );
    const response = await GET(request as any, {
      params: { slug: 'elite-construction-staffing' },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(data.data.name).toBe('Elite Construction Staffing');
    expect(data.data.trades).toHaveLength(1);
    expect(data.data.regions).toHaveLength(1);
  });

  it('should return 404 for non-existent agency', async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      }),
    };

    supabase.from.mockReturnValue(mockQueryBuilder);

    const request = new Request(
      'http://localhost:3000/api/agencies/non-existent'
    );
    const response = await GET(request as any, {
      params: { slug: 'non-existent' },
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('should handle database errors', async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'DATABASE_ERROR', message: 'Connection failed' },
      }),
    };

    supabase.from.mockReturnValue(mockQueryBuilder);

    const request = new Request(
      'http://localhost:3000/api/agencies/elite-construction-staffing'
    );
    const response = await GET(request as any, {
      params: { slug: 'elite-construction-staffing' },
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('DATABASE_ERROR');
  });

  it('should validate slug parameter', async () => {
    const request = new Request('http://localhost:3000/api/agencies/');
    const response = await GET(request as any, { params: { slug: '' } });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('INVALID_PARAMS');
  });

  it('should include cache headers on success', async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          ...mockAgency,
          agency_trades: [],
          agency_regions: [],
        },
        error: null,
      }),
    };

    supabase.from.mockReturnValue(mockQueryBuilder);

    const request = new Request(
      'http://localhost:3000/api/agencies/elite-construction-staffing'
    );
    const response = await GET(request as any, {
      params: { slug: 'elite-construction-staffing' },
    });

    expect(response.headers.get('Cache-Control')).toContain('public');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60');
  });
});
