/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { useAgencies, useAgency } from '../use-agencies';
import { AgenciesApiResponse } from '@/types/api';
import React from 'react';

// Mock fetch globally
global.fetch = jest.fn();

// Mock data
const mockAgenciesResponse: AgenciesApiResponse = {
  data: [
    {
      id: '1',
      name: 'Test Agency 1',
      slug: 'test-agency-1',
      description: 'Test description',
      logo_url: null,
      website: 'https://test1.com',
      phone: '555-0001',
      email: 'test1@example.com',
      is_claimed: true,
      offers_per_diem: true,
      is_union: false,
      founded_year: 2020,
      employee_count: '10-50',
      headquarters: 'Austin, TX',
      rating: 4.5,
      review_count: 10,
      project_count: 25,
      verified: true,
      featured: false,
      trades: [
        {
          id: '1',
          name: 'Electricians',
          slug: 'electricians',
          description: null,
        },
      ],
      regions: [{ id: '1', name: 'Texas', code: 'TX' }],
    },
    {
      id: '2',
      name: 'Test Agency 2',
      slug: 'test-agency-2',
      description: 'Another test description',
      logo_url: null,
      website: 'https://test2.com',
      phone: '555-0002',
      email: 'test2@example.com',
      is_claimed: false,
      offers_per_diem: false,
      is_union: true,
      founded_year: 2018,
      employee_count: '50-100',
      headquarters: 'Dallas, TX',
      rating: 4.0,
      review_count: 5,
      project_count: 15,
      verified: false,
      featured: true,
      trades: [
        { id: '2', name: 'Plumbers', slug: 'plumbers', description: null },
      ],
      regions: [
        { id: '1', name: 'Texas', code: 'TX' },
        { id: '2', name: 'California', code: 'CA' },
      ],
    },
  ],
  pagination: {
    total: 2,
    limit: 20,
    offset: 0,
    hasMore: false,
  },
};

// Wrapper component for SWR
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
      {children}
    </SWRConfig>
  );
};

describe('useAgencies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('should fetch agencies successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgenciesResponse,
    });

    const { result } = renderHook(() => useAgencies(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Wait for data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockAgenciesResponse);
    expect(result.current.error).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/agencies?limit=20&offset=0'
    );
  });

  it('should handle query parameters correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgenciesResponse,
    });

    const { result } = renderHook(
      () =>
        useAgencies({
          search: 'construction',
          trades: ['electricians', 'plumbers'],
          states: ['TX', 'CA'],
          limit: 10,
          offset: 20,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/agencies?search=construction&trades%5B%5D=electricians&trades%5B%5D=plumbers&states%5B%5D=TX&states%5B%5D=CA&limit=10&offset=20'
    );
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Internal server error';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: { message: errorMessage },
      }),
    });

    const { result } = renderHook(() => useAgencies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe(errorMessage);
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() => useAgencies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Network error');
  });

  it('should not fetch when disabled', async () => {
    const { result } = renderHook(() => useAgencies({ enabled: false }), {
      wrapper: createWrapper(),
    });

    // Should not be loading when disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle empty search parameters', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgenciesResponse,
    });

    const { result } = renderHook(
      () =>
        useAgencies({
          search: '',
          trades: [],
          states: [],
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not include empty parameters in the URL
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/agencies?limit=20&offset=0'
    );
  });

  it('should provide mutate function', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgenciesResponse,
    });

    const { result } = renderHook(() => useAgencies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.mutate).toBe('function');
  });

  it('should retry on error', async () => {
    // First two calls fail, third succeeds
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgenciesResponse,
      });

    const { result } = renderHook(
      () =>
        useAgencies({
          swrOptions: {
            errorRetryInterval: 10, // Fast retry for testing
          },
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(
      () => {
        expect(result.current.data).toEqual(mockAgenciesResponse);
      },
      { timeout: 5000 }
    );

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});

describe('useAgency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('should fetch a single agency by slug', async () => {
    const singleAgencyResponse: AgenciesApiResponse = {
      data: [mockAgenciesResponse.data[0]],
      pagination: {
        total: 1,
        limit: 1,
        offset: 0,
        hasMore: false,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => singleAgencyResponse,
    });

    const { result } = renderHook(() => useAgency('test-agency-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.agency).toEqual(mockAgenciesResponse.data[0]);
    expect(result.current.error).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/agencies?search=test-agency-1&limit=1'
    );
  });

  it('should handle undefined slug', async () => {
    const { result } = renderHook(() => useAgency(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.agency).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle agency not found', async () => {
    const emptyResponse: AgenciesApiResponse = {
      data: [],
      pagination: {
        total: 0,
        limit: 1,
        offset: 0,
        hasMore: false,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyResponse,
    });

    const { result } = renderHook(() => useAgency('non-existent-agency'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.agency).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });
});
