import { GET } from '../route';
import { createMockNextRequest } from '@/__tests__/utils/api-mocks';
import { createClient } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

describe('GET /api/agencies/[slug]', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should return agency data for valid slug', async () => {
    const mockAgency = {
      id: '1',
      name: 'Test Agency',
      slug: 'test-agency',
      description: 'A test agency',
      trades: [{ id: 1, name: 'Electrician' }],
      regions: [{ id: 1, name: 'TX' }],
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
    expect(data).toEqual(mockAgency);
  });

  it('should return 404 for non-existent agency', async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/non-existent',
    });

    const response = await GET(request, { params: { slug: 'non-existent' } });

    expect(response.status).toBe(404);
  });

  it('should handle database errors', async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'Database connection error' },
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/test-agency',
    });

    const response = await GET(request, { params: { slug: 'test-agency' } });

    expect(response.status).toBe(500);
  });

  it('should select all required fields', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: '1', name: 'Test' },
      error: null,
    });

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/test-agency',
    });

    await GET(request, { params: { slug: 'test-agency' } });

    expect(mockSupabase.select).toHaveBeenCalledWith(
      expect.stringContaining('trades')
    );
    expect(mockSupabase.select).toHaveBeenCalledWith(
      expect.stringContaining('regions')
    );
  });

  it('should handle missing slug parameter', async () => {
    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies/',
    });

    const response = await GET(request, { params: { slug: '' } });

    expect(response.status).toBe(400);
  });

  it('should handle special characters in slug', async () => {
    const specialSlug = 'test-agency-123';

    mockSupabase.single.mockResolvedValue({
      data: { id: '1', slug: specialSlug },
      error: null,
    });

    const request = createMockNextRequest({
      url: `http://localhost:3000/api/agencies/${specialSlug}`,
    });

    await GET(request, { params: { slug: specialSlug } });

    expect(mockSupabase.eq).toHaveBeenCalledWith('slug', specialSlug);
  });
});
