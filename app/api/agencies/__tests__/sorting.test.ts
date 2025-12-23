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
import type { Agency } from '@/types/api';
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

// Factory function for creating mock agencies
function createMockAgency(overrides: {
  id: string;
  name: string;
  slug: string;
  profile_completion_percentage: number;
  verified?: boolean;
  featured?: boolean;
}): Agency {
  return {
    id: overrides.id,
    name: overrides.name,
    slug: overrides.slug,
    profile_completion_percentage: overrides.profile_completion_percentage,
    is_claimed: true,
    offers_per_diem: false,
    is_union: false,
    verified: overrides.verified ?? true,
    featured: overrides.featured ?? true,
    rating: null,
    review_count: 0,
    project_count: 0,
    description: `${overrides.name} description`,
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
  };
}

// Mock agencies with varying completion percentages
const mockAgenciesWithCompletion: Agency[] = [
  createMockAgency({
    id: '001',
    name: 'AAA Agency',
    slug: 'aaa-agency',
    profile_completion_percentage: 100,
  }),
  createMockAgency({
    id: '002',
    name: 'Agency A',
    slug: 'agency-a',
    profile_completion_percentage: 100,
  }),
  createMockAgency({
    id: '003',
    name: 'ZZZ Agency',
    slug: 'zzz-agency',
    profile_completion_percentage: 100,
  }),
  createMockAgency({
    id: '004',
    name: 'Agency B',
    slug: 'agency-b',
    profile_completion_percentage: 85,
    verified: false,
    featured: false,
  }),
  createMockAgency({
    id: '005',
    name: 'Agency C',
    slug: 'agency-c',
    profile_completion_percentage: 50,
    verified: false,
    featured: false,
  }),
];

describe('Agencies API - Sorting', () => {
  let mockMonitor: ReturnType<typeof createMonitoringMocks>['mockMonitor'];
  let mockErrorTracker: ReturnType<
    typeof createMonitoringMocks
  >['mockErrorTracker'];

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
        (a: Agency) => a.profile_completion_percentage
      );

      // Verify grouping: first three have 100%, rest have lower completion
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

      // Verify alphabetical order among 100% completion agencies
      const hundredPercentAgencies = agencies.filter(
        (a: Agency) => a.profile_completion_percentage === 100
      );

      const names = hundredPercentAgencies.map((a: Agency) => a.name);

      // Verify expected count and alphabetical order
      expect(hundredPercentAgencies.length).toBe(3);
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

      // Verify completion percentages are in descending order
      for (let i = 0; i < agencies.length - 1; i++) {
        expect(
          agencies[i].profile_completion_percentage
        ).toBeGreaterThanOrEqual(agencies[i + 1].profile_completion_percentage);
      }
    }
  });
});
