import { GET } from '../route';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: null, // Will be set in each test
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set the mocked supabase client
    const supabaseMock = require('@/lib/supabase');
    supabaseMock.supabase = mockSupabase;
  });

  it('should return success when connection works', async () => {
    mockSupabase.select.mockResolvedValue({
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

    mockSupabase.select.mockResolvedValue({
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
        agencies: { connected: false },
      },
    });
  });

  it('should query agencies table', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [],
      error: null,
    });

    await GET();

    expect(mockSupabase.from).toHaveBeenCalledWith('agencies');
    expect(mockSupabase.select).toHaveBeenCalledWith('id', { head: true, count: 'exact' });
  });

  it('should handle empty result set', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [],
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.tables.agencies.count).toBe(0);
  });

  it('should handle null data response', async () => {
    mockSupabase.select.mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.tables.agencies.count).toBe(0);
  });

  it('should handle when supabase client is not initialized', async () => {
    // Set supabase to null
    const supabaseMock = require('@/lib/supabase');
    supabaseMock.supabase = null;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Supabase client not initialized',
      env: {
        url: 'Not set',
        key: 'Not set',
      },
    });
  });
});
