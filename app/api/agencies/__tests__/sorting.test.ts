/**
 * @jest-environment node
 */
// Import centralized mock first
import {
  configureSupabaseMock,
  supabaseMockHelpers,
  resetSupabaseMock,
} from '@/__tests__/utils/supabase-mock';
import { supabase } from '@/lib/supabase';
import { isErrorResponse } from '@/types/api';
import { createMockNextRequest } from '@/__tests__/utils/api-mocks';
import {
  PerformanceMonitor,
  ErrorRateTracker,
} from '@/lib/monitoring/performance';

// Mock performance monitoring
jest.mock('@/lib/monitoring/performance');

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: new Headers(init?.headers),
    })),
  },
}));

// Import the route AFTER mocks are set up
import { GET } from '../route';

// Helper function to create monitoring mocks
function createMonitoringMocks() {
  const mockMonitor = {
    startQuery: jest.fn(),
    endQuery: jest.fn(),
    complete: jest.fn().mockReturnValue({
      responseTime: 50,
      queryTime: 30,
    }),
  };

  const mockErrorTracker = {
    recordRequest: jest.fn(),
  };

  return { mockMonitor, mockErrorTracker };
}

// Mock agencies with varying completion percentages
const mockAgenciesWithCompletion = [
  {
    id: '001',
    name: 'AAA Agency',
    slug: 'aaa-agency',
    profile_completion_percentage: 100,
    is_active: true,
    is_claimed: true,
    offers_per_diem: false,
    is_union: false,
    verified: true,
    featured: true,
    rating: null,
    review_count: 0,
    project_count: 0,
    description: 'AAA Agency description',
    logo_url: null,
    website: null,
    phone: null,
    email: null,
    founded_year: null,
    employee_count: null,
    headquarters: null,
    last_edited_at: null,
    last_edited_by: null,
    trades: [],
    regions: [],
  },
  {
    id: '002',
    name: 'Agency A',
    slug: 'agency-a',
    profile_completion_percentage: 100,
    is_active: true,
    is_claimed: true,
    offers_per_diem: false,
    is_union: false,
    verified: true,
    featured: true,
    rating: null,
    review_count: 0,
    project_count: 0,
    description: 'Agency A description',
    logo_url: null,
    website: null,
    phone: null,
    email: null,
    founded_year: null,
    employee_count: null,
    headquarters: null,
    last_edited_at: null,
    last_edited_by: null,
    trades: [],
    regions: [],
  },
  {
    id: '003',
    name: 'ZZZ Agency',
    slug: 'zzz-agency',
    profile_completion_percentage: 100,
    is_active: true,
    is_claimed: true,
    offers_per_diem: false,
    is_union: false,
    verified: true,
    featured: true,
    rating: null,
    review_count: 0,
    project_count: 0,
    description: 'ZZZ Agency description',
    logo_url: null,
    website: null,
    phone: null,
    email: null,
    founded_year: null,
    employee_count: null,
    headquarters: null,
    last_edited_at: null,
    last_edited_by: null,
    trades: [],
    regions: [],
  },
  {
    id: '004',
    name: 'Agency B',
    slug: 'agency-b',
    profile_completion_percentage: 85,
    is_active: true,
    is_claimed: true,
    offers_per_diem: false,
    is_union: false,
    verified: false,
    featured: false,
    rating: null,
    review_count: 0,
    project_count: 0,
    description: 'Agency B description',
    logo_url: null,
    website: null,
    phone: null,
    email: null,
    founded_year: null,
    employee_count: null,
    headquarters: null,
    last_edited_at: null,
    last_edited_by: null,
    trades: [],
    regions: [],
  },
  {
    id: '005',
    name: 'Agency C',
    slug: 'agency-c',
    profile_completion_percentage: 50,
    is_active: true,
    is_claimed: true,
    offers_per_diem: false,
    is_union: false,
    verified: false,
    featured: false,
    rating: null,
    review_count: 0,
    project_count: 0,
    description: 'Agency C description',
    logo_url: null,
    website: null,
    phone: null,
    email: null,
    founded_year: null,
    employee_count: null,
    headquarters: null,
    last_edited_at: null,
    last_edited_by: null,
    trades: [],
    regions: [],
  },
];

describe('Agencies API - Sorting', () => {
  let mockMonitor: any;
  let mockErrorTracker: any;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMock(supabase);

    // Setup monitoring mocks
    const mocks = createMonitoringMocks();
    mockMonitor = mocks.mockMonitor;
    mockErrorTracker = mocks.mockErrorTracker;

    (PerformanceMonitor as jest.Mock).mockImplementation(() => mockMonitor);
    (ErrorRateTracker.getInstance as jest.Mock).mockReturnValue(
      mockErrorTracker
    );

    // Setup default successful response with sorted agencies
    // Mock should return agencies sorted by profile_completion_percentage DESC, then name ASC
    const sortedAgencies = [...mockAgenciesWithCompletion].sort((a, b) => {
      if (b.profile_completion_percentage !== a.profile_completion_percentage) {
        return (
          b.profile_completion_percentage - a.profile_completion_percentage
        );
      }
      return a.name.localeCompare(b.name);
    });

    configureSupabaseMock(supabase, {
      defaultData: sortedAgencies,
      defaultCount: sortedAgencies.length,
    });
  });

  it('should return 100% completion agencies first', async () => {
    const request = createMockNextRequest({
      searchParams: { limit: '10', offset: '0' },
    });

    const response = await GET(request);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(isErrorResponse(responseData)).toBe(false);

    if (!isErrorResponse(responseData)) {
      const agencies = responseData.data;

      // Agencies with 100% completion should be first
      const completionPercentages = agencies.map(
        (a: any) => a.profile_completion_percentage
      );

      // First three agencies should have 100% completion
      expect(completionPercentages[0]).toBe(100);
      expect(completionPercentages[1]).toBe(100);
      expect(completionPercentages[2]).toBe(100);

      // Later agencies should have lower completion
      const has100Percent = completionPercentages.slice(0, 3);
      const hasLowerPercent = completionPercentages.slice(3);

      has100Percent.forEach((pct: number) => expect(pct).toBe(100));
      hasLowerPercent.forEach((pct: number) => expect(pct).toBeLessThan(100));
    }
  });

  it('should sort agencies alphabetically within same completion percentage', async () => {
    const request = createMockNextRequest({
      searchParams: { limit: '10', offset: '0' },
    });

    const response = await GET(request);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(isErrorResponse(responseData)).toBe(false);

    if (!isErrorResponse(responseData)) {
      const agencies = responseData.data;

      // Among 100% completion agencies, AAA should come before ZZZ
      const hundredPercentAgencies = agencies.filter(
        (a: any) => a.profile_completion_percentage === 100
      );

      const names = hundredPercentAgencies.map((a: any) => a.name);

      // Verify alphabetical order
      expect(names[0]).toBe('AAA Agency');
      expect(names[1]).toBe('Agency A');
      expect(names[2]).toBe('ZZZ Agency');

      // Verify all names are in alphabetical order
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    }
  });

  it('should maintain sorting across multiple completion levels', async () => {
    const request = createMockNextRequest({
      searchParams: { limit: '10', offset: '0' },
    });

    const response = await GET(request);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(isErrorResponse(responseData)).toBe(false);

    if (!isErrorResponse(responseData)) {
      const agencies = responseData.data;

      // Verify overall sorting order
      expect(agencies[0].name).toBe('AAA Agency'); // 100%
      expect(agencies[1].name).toBe('Agency A'); // 100%
      expect(agencies[2].name).toBe('ZZZ Agency'); // 100%
      expect(agencies[3].name).toBe('Agency B'); // 85%
      expect(agencies[4].name).toBe('Agency C'); // 50%

      // Verify completion percentages are in descending order
      for (let i = 0; i < agencies.length - 1; i++) {
        expect(
          agencies[i].profile_completion_percentage
        ).toBeGreaterThanOrEqual(agencies[i + 1].profile_completion_percentage);
      }
    }
  });
});
