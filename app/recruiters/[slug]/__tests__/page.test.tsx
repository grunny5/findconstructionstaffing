/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/agencies/[slug]/route';
import { Agency } from '@/types/api';
import {
  createMultiTableMock,
  type SupabaseMock,
} from '@/__tests__/utils/multi-table-mock';

// Mock Supabase before any imports
jest.mock('@/lib/supabase', () => {
  const mockFrom = jest.fn();

  return {
    supabase: {
      from: mockFrom,
      select: jest.fn(),
      eq: jest.fn(),
      in: jest.fn(),
      not: jest.fn(),
      or: jest.fn(),
      range: jest.fn(),
      order: jest.fn(),
      single: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      insert: jest.fn(),
      delete: jest.fn(),
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
  const { supabase } = require('@/lib/supabase') as { supabase: SupabaseMock };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch agency by slug successfully', async () => {
    createMultiTableMock(supabase, {
      agencies: {
        data: [
          {
            ...mockAgency,
            agency_trades: [
              {
                trade: {
                  id: 't1',
                  name: 'Electricians',
                  slug: 'electricians',
                },
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
        ],
      },
      agency_compliance: { data: [] },
    });

    const request = new Request(
      'http://localhost:3000/api/agencies/elite-construction-staffing'
    );
    const response = await GET(request as unknown as NextRequest, {
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
    createMultiTableMock(supabase, {
      agencies: {
        data: [],
        error: { code: 'PGRST116', message: 'No rows found' },
      },
      agency_compliance: { data: [] },
    });

    const request = new Request(
      'http://localhost:3000/api/agencies/non-existent'
    );
    const response = await GET(request as unknown as NextRequest, {
      params: { slug: 'non-existent' },
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('should handle database errors', async () => {
    createMultiTableMock(supabase, {
      agencies: {
        data: [],
        error: { code: 'DATABASE_ERROR', message: 'Connection failed' },
      },
      agency_compliance: { data: [] },
    });

    const request = new Request(
      'http://localhost:3000/api/agencies/elite-construction-staffing'
    );
    const response = await GET(request as unknown as NextRequest, {
      params: { slug: 'elite-construction-staffing' },
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('DATABASE_ERROR');
  });

  it('should validate slug parameter', async () => {
    const request = new Request('http://localhost:3000/api/agencies/');
    const response = await GET(request as unknown as NextRequest, {
      params: { slug: '' },
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('INVALID_PARAMS');
  });

  it('should include cache headers on success', async () => {
    createMultiTableMock(supabase, {
      agencies: {
        data: [
          {
            ...mockAgency,
            agency_trades: [],
            agency_regions: [],
          },
        ],
      },
      agency_compliance: { data: [] },
    });

    const request = new Request(
      'http://localhost:3000/api/agencies/elite-construction-staffing'
    );
    const response = await GET(request as unknown as NextRequest, {
      params: { slug: 'elite-construction-staffing' },
    });

    expect(response.headers.get('Cache-Control')).toContain('public');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60');
  });

  it('should include compliance data in response', async () => {
    createMultiTableMock(supabase, {
      agencies: {
        data: [
          {
            ...mockAgency,
            agency_trades: [],
            agency_regions: [],
          },
        ],
      },
      agency_compliance: {
        data: [
          {
            id: 'comp-1',
            agency_id: '1',
            compliance_type: 'osha_certified',
            is_active: true,
            is_verified: true,
            expiration_date: '2026-12-31',
          },
        ],
      },
    });

    const request = new Request(
      'http://localhost:3000/api/agencies/elite-construction-staffing'
    );
    const response = await GET(request as unknown as NextRequest, {
      params: { slug: 'elite-construction-staffing' },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(data.data.compliance).toBeDefined();
    expect(data.data.compliance).toHaveLength(1);
    expect(data.data.compliance[0].type).toBe('osha_certified');
  });
});
