/**
 * @jest-environment node
 */
// Mock supabase first before any imports
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  },
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      headers: new Map(),
    })),
  },
}));

import { GET } from '../route';
import { createMockNextRequest } from '@/__tests__/utils/api-mocks';
import { HTTP_STATUS, ERROR_CODES } from '@/types/api';
import { supabase } from '@/lib/supabase';

describe('GET /api/agencies/[slug]', () => {
  const mockSupabase = supabase as any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
  });

  it('should return agency data for valid slug', async () => {
    const mockAgency = {
      id: '1',
      name: 'Test Agency',
      slug: 'test-agency',
      description: 'A test agency',
      agency_trades: [
        {
          trade: { id: 1, name: 'Electrician', slug: 'electrician' }
        }
      ],
      agency_regions: [
        {
          region: { id: 1, name: 'Texas', state_code: 'TX', slug: 'tx' }
        }
      ],
    };

    mockSupabase.single.mockResolvedValue({
      data: mockAgency,
      error: null,
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/test-agency',
    });

    const response = await GET(request, { params: { slug: 'test-agency' } });
    const data = await response.json();

    expect(mockSupabase.from).toHaveBeenCalledWith('agencies');
    expect(mockSupabase.eq).toHaveBeenCalledWith('slug', 'test-agency');
    expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
    expect(data.data.id).toBe('1');
    expect(data.data.name).toBe('Test Agency');
    expect(data.data.trades).toHaveLength(1);
    expect(data.data.regions).toHaveLength(1);
  });

  it('should return 404 for non-existent agency', async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/non-existent',
    });

    const response = await GET(request, {
      params: { slug: 'non-existent' },
    });

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);

    const data = await response.json();
    expect(data.error).toEqual({
      code: ERROR_CODES.NOT_FOUND,
      message: 'Agency not found',
    });
  });

  it('should handle database errors', async () => {
    const dbError = new Error('Database connection failed');
    
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: dbError,
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/test-agency',
    });

    const response = await GET(request, { params: { slug: 'test-agency' } });

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);

    const data = await response.json();
    expect(data.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
  });

  it('should handle missing slug parameter', async () => {
    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/',
    });

    const response = await GET(request, { params: { slug: '' } });

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);

    const data = await response.json();
    expect(data.error).toEqual({
      code: ERROR_CODES.INVALID_PARAMS,
      message: 'Invalid agency slug',
    });
  });

  it('should handle non-existent agency with special characters', async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/Invalid%20Slug!',
    });

    const response = await GET(request, {
      params: { slug: 'Invalid Slug!' },
    });

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);

    const data = await response.json();
    expect(data.error).toEqual({
      code: ERROR_CODES.NOT_FOUND,
      message: 'Agency not found',
    });
  });
});