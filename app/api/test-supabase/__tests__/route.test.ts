import { GET } from '../route';
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

describe('GET /api/test-supabase', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should return success when connection works', async () => {
    mockSupabase.limit.mockResolvedValue({
      data: [{ id: '1' }],
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({
      success: true,
      message: 'Successfully connected to Supabase',
      tables: {
        agencies: { connected: true, count: 1 },
      },
    });
  });

  it('should return error details when connection fails', async () => {
    const mockError = {
      message: 'Connection timeout',
      code: 'TIMEOUT',
    };

    mockSupabase.limit.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      message: 'Failed to connect to Supabase',
      error: mockError,
      tables: {
        agencies: { connected: false, error: mockError },
      },
    });
  });

  it('should query agencies table', async () => {
    mockSupabase.limit.mockResolvedValue({
      data: [],
      error: null,
    });

    await GET();

    expect(mockSupabase.from).toHaveBeenCalledWith('agencies');
    expect(mockSupabase.select).toHaveBeenCalledWith('*');
    expect(mockSupabase.limit).toHaveBeenCalledWith(1);
  });

  it('should handle empty result set', async () => {
    mockSupabase.limit.mockResolvedValue({
      data: [],
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.tables.agencies.count).toBe(0);
  });

  it('should handle null data response', async () => {
    mockSupabase.limit.mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.tables.agencies.count).toBe(0);
  });
});