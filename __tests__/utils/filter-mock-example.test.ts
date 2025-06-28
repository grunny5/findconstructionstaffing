/**
 * Example test file demonstrating usage of configureMockForFilters helper
 * This shows how to use the helper in real test scenarios
 */
import { configureSupabaseMock, configureMockForFilters, resetSupabaseMock } from './supabase-mock';
import { supabase } from '@/lib/supabase';
import { createMockNextRequest } from './api-mocks';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: new Headers(init?.headers)
    }))
  }
}));

// Import the route AFTER mocks are set up
import { GET } from '../../app/api/agencies/route';

describe('Filter Mock Helper Usage Examples', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMock(supabase);
  });

  it('should simplify trade filter testing', async () => {
    // Configure mock with test agencies
    configureSupabaseMock(supabase, {
      defaultData: [
        { id: 'agency-1', name: 'Electric Works', trades: [], regions: [] },
        { id: 'agency-2', name: 'Plumbing Pro', trades: [], regions: [] }
      ],
      defaultCount: 2
    });

    // Use the helper to setup trade filter mocking  
    configureMockForFilters(supabase, {
      trades: {
        slugs: ['electricians'],
        ids: ['trade-elec-1'],
        agencyIds: ['agency-1', 'agency-2']
      }
    });

    const mockRequest = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies',
      searchParams: { 'trades[]': 'electricians' }
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    // Verify the filter queries were made
    expect(supabase.from).toHaveBeenCalledWith('trades');
    expect(supabase.from).toHaveBeenCalledWith('agency_trades');
    
    // Verify successful response  
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
  });

  it('should simplify state filter testing', async () => {
    // Configure mock with test agencies
    configureSupabaseMock(supabase, {
      defaultData: [
        { id: 'agency-1', name: 'Texas Builder', trades: [], regions: [] }
      ],
      defaultCount: 1
    });

    // Use the helper to setup state filter mocking
    configureMockForFilters(supabase, {
      states: {
        codes: ['TX'],
        regionIds: ['region-tx-1'],
        agencyIds: ['agency-1']
      }
    });

    const mockRequest = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies',
      searchParams: { 'states[]': 'TX' }
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    // Verify the filter queries were made
    expect(supabase.from).toHaveBeenCalledWith('regions');
    expect(supabase.from).toHaveBeenCalledWith('agency_regions');
    
    // Verify successful response
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
  });

  it('should handle combined trade and state filters', async () => {
    // Configure mock with test agencies
    configureSupabaseMock(supabase, {
      defaultData: [
        { id: 'agency-1', name: 'Texas Electric', trades: [], regions: [] }
      ],
      defaultCount: 1
    });

    // Use the helper to setup both filter types
    configureMockForFilters(supabase, {
      trades: {
        slugs: ['electricians'],
        ids: ['trade-elec-1'],
        agencyIds: ['agency-1', 'agency-2'] // More agencies match trade
      },
      states: {
        codes: ['TX'],
        regionIds: ['region-tx-1'], 
        agencyIds: ['agency-1'] // Fewer agencies match state
      }
    });

    const mockRequest = createMockNextRequest({
      url: 'http://localhost:3000/api/agencies',
      searchParams: { 
        'trades[]': 'electricians',
        'states[]': 'TX'
      }
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    // Verify all filter queries were made
    expect(supabase.from).toHaveBeenCalledWith('trades');
    expect(supabase.from).toHaveBeenCalledWith('agency_trades');
    expect(supabase.from).toHaveBeenCalledWith('regions');
    expect(supabase.from).toHaveBeenCalledWith('agency_regions');
    
    // Verify successful response
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
  });
});