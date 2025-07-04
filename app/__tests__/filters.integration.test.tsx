/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HomePage from '../page';
import { useAgencies } from '@/hooks/use-agencies';
import { useRouter, useSearchParams } from 'next/navigation';
import { allTrades, allStates } from '@/lib/mock-data';
import type { Agency, Trade, Region } from '@/types/supabase';
import type { FilterState } from '@/components/DirectoryFilters';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the useAgencies hook
jest.mock('@/hooks/use-agencies');

// Mock components
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/AgencyCard', () => ({
  __esModule: true,
  default: ({ agency }: { agency: Agency }) => (
    <div data-testid={`agency-${agency.id}`}>
      <h3>{agency.name}</h3>
      <div data-testid={`trades-${agency.id}`}>
        {agency.trades?.map((t: Trade) => t.name).join(', ')}
      </div>
      <div data-testid={`regions-${agency.id}`}>
        {agency.regions?.map((r: Region) => r.name).join(', ')}
      </div>
    </div>
  ),
}));

jest.mock('@/components/AgencyCardSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="skeleton">Loading...</div>,
}));

// Mock DirectoryFilters with actual functionality
jest.mock('@/components/DirectoryFilters', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    // This will be replaced by a custom implementation in each test
    return null;
  }),
}));

// Extended Agency type for testing that includes additional UI properties
interface TestAgency extends Agency {
  rating?: number;
  reviewCount?: number;
  projectCount?: number;
  featured?: boolean;
  verified?: boolean;
}

interface MockAgenciesData {
  all: TestAgency[];
  electricians: TestAgency[];
  texas: TestAgency[];
}

// Helper to create test agency with defaults
const createTestAgency = (overrides: Partial<TestAgency>): TestAgency => ({
  logo_url: undefined,
  website: undefined,
  phone: undefined,
  email: undefined,
  is_claimed: true,
  is_active: true,
  offers_per_diem: false,
  is_union: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
  // Ensure required fields are present
  id: overrides.id || '',
  name: overrides.name || '',
  slug: overrides.slug || '',
});

const mockAgencies: MockAgenciesData = {
  all: [
    createTestAgency({
      id: '1',
      name: 'Elite Construction Staffing',
      slug: 'elite-construction-staffing',
      description: 'Premier construction staffing',
      trades: [
        { id: 't1', name: 'Electrician', slug: 'electrician' },
        { id: 't2', name: 'Plumber', slug: 'plumber' },
      ],
      regions: [
        { id: 'r1', name: 'Texas', state_code: 'TX', slug: 'texas' },
        { id: 'r2', name: 'California', state_code: 'CA', slug: 'california' },
      ],
      rating: 4.5,
      reviewCount: 25,
      projectCount: 150,
      featured: true,
      verified: true,
    }),
    createTestAgency({
      id: '2',
      name: 'National Staffing Solutions',
      slug: 'national-staffing-solutions',
      description: 'Nationwide construction staffing',
      trades: [
        { id: 't3', name: 'Carpenter', slug: 'carpenter' },
        { id: 't1', name: 'Electrician', slug: 'electrician' },
      ],
      regions: [
        { id: 'r3', name: 'New York', state_code: 'NY', slug: 'new-york' },
        { id: 'r2', name: 'California', state_code: 'CA', slug: 'california' },
      ],
      rating: 4.2,
      reviewCount: 45,
      projectCount: 200,
      featured: false,
      verified: true,
    }),
    createTestAgency({
      id: '3',
      name: 'Texas Trade Specialists',
      slug: 'texas-trade-specialists',
      description: 'Texas-focused staffing',
      trades: [{ id: 't2', name: 'Plumber', slug: 'plumber' }],
      regions: [{ id: 'r1', name: 'Texas', state_code: 'TX', slug: 'texas' }],
      rating: 4.0,
      reviewCount: 20,
      projectCount: 80,
      featured: false,
      verified: true,
    }),
  ],
  electricians: [
    createTestAgency({
      id: '1',
      name: 'Elite Construction Staffing',
      slug: 'elite-construction-staffing',
      description: 'Premier construction staffing',
      trades: [
        { id: 't1', name: 'Electrician', slug: 'electrician' },
        { id: 't2', name: 'Plumber', slug: 'plumber' },
      ],
      regions: [
        { id: 'r1', name: 'Texas', state_code: 'TX', slug: 'texas' },
        { id: 'r2', name: 'California', state_code: 'CA', slug: 'california' },
      ],
      rating: 4.5,
      reviewCount: 25,
      projectCount: 150,
      featured: true,
      verified: true,
    }),
    createTestAgency({
      id: '2',
      name: 'National Staffing Solutions',
      slug: 'national-staffing-solutions',
      description: 'Nationwide construction staffing',
      trades: [
        { id: 't3', name: 'Carpenter', slug: 'carpenter' },
        { id: 't1', name: 'Electrician', slug: 'electrician' },
      ],
      regions: [
        { id: 'r3', name: 'New York', state_code: 'NY', slug: 'new-york' },
        { id: 'r2', name: 'California', state_code: 'CA', slug: 'california' },
      ],
      rating: 4.2,
      reviewCount: 45,
      projectCount: 200,
      featured: false,
      verified: true,
    }),
  ],
  texas: [
    createTestAgency({
      id: '1',
      name: 'Elite Construction Staffing',
      slug: 'elite-construction-staffing',
      description: 'Premier construction staffing',
      trades: [
        { id: 't1', name: 'Electrician', slug: 'electrician' },
        { id: 't2', name: 'Plumber', slug: 'plumber' },
      ],
      regions: [
        { id: 'r1', name: 'Texas', state_code: 'TX', slug: 'texas' },
        { id: 'r2', name: 'California', state_code: 'CA', slug: 'california' },
      ],
      rating: 4.5,
      reviewCount: 25,
      projectCount: 150,
      featured: true,
      verified: true,
    }),
    createTestAgency({
      id: '3',
      name: 'Texas Trade Specialists',
      slug: 'texas-trade-specialists',
      description: 'Texas-focused staffing',
      trades: [{ id: 't2', name: 'Plumber', slug: 'plumber' }],
      regions: [{ id: 'r1', name: 'Texas', state_code: 'TX', slug: 'texas' }],
      rating: 4.0,
      reviewCount: 20,
      projectCount: 80,
      featured: false,
      verified: true,
    }),
  ],
};

// Props interface for the mock DirectoryFilters component
interface MockDirectoryFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  totalResults?: number;
  isLoading?: boolean;
  initialFilters?: Partial<FilterState>;
}

// Simplified mock DirectoryFilters component to reduce complexity and flakiness
// Track filter state outside component to simulate multiple selections
let currentFilters: FilterState = {
  search: '',
  trades: [],
  states: [],
  perDiem: null,
  union: null,
  claimedOnly: false,
  companySize: [],
  focusAreas: [],
};

const createMockDirectoryFilters = () => {
  const MockDirectoryFilters = ({
    onFiltersChange,
    totalResults = 0,
    isLoading = false,
    initialFilters = {},
  }: MockDirectoryFiltersProps) => {
    React.useEffect(() => {
      // Reset filters on mount
      currentFilters = {
        search: '',
        trades: [],
        states: [],
        perDiem: null,
        union: null,
        claimedOnly: false,
        companySize: [],
        focusAreas: [],
        ...initialFilters,
      };
    }, []);

    const handleTradeClick = (trade: string) => {
      const newTrades = currentFilters.trades.includes(trade)
        ? currentFilters.trades.filter(t => t !== trade)
        : [...currentFilters.trades, trade];
      currentFilters = { ...currentFilters, trades: newTrades };
      onFiltersChange(currentFilters);
    };

    const handleStateClick = (state: string) => {
      const newStates = currentFilters.states.includes(state)
        ? currentFilters.states.filter(s => s !== state)
        : [...currentFilters.states, state];
      currentFilters = { ...currentFilters, states: newStates };
      onFiltersChange(currentFilters);
    };

    const handleSearchChange = (value: string) => {
      currentFilters = { ...currentFilters, search: value };
      onFiltersChange(currentFilters);
    };

    const handleClearAll = () => {
      currentFilters = {
        search: '',
        trades: [],
        states: [],
        perDiem: null,
        union: null,
        claimedOnly: false,
        companySize: [],
        focusAreas: [],
      };
      onFiltersChange(currentFilters);
    };

    const activeFilterCount = currentFilters.trades.length + currentFilters.states.length;

    return (
      <div data-testid="directory-filters">
        <div data-testid="filter-results">{totalResults} results</div>
        {isLoading && <div data-testid="filter-loading">Loading...</div>}

        <input
          type="text"
          placeholder="Search agencies by name..."
          onChange={(e) => handleSearchChange(e.target.value)}
        />

        <div data-testid="trade-filters">
          <button onClick={() => handleTradeClick('electrician')}>
            Electrician
          </button>
          <button onClick={() => handleTradeClick('plumber')}>
            Plumber
          </button>
          <button onClick={() => handleTradeClick('carpenter')}>
            Carpenter
          </button>
        </div>

        <div data-testid="state-filters">
          <button onClick={() => handleStateClick('TX')}>Texas</button>
          <button onClick={() => handleStateClick('CA')}>California</button>
          <button onClick={() => handleStateClick('NY')}>New York</button>
        </div>

        <button
          onClick={handleClearAll}
          data-testid="clear-all-filters-button"
          aria-label="Clear all applied filters"
        >
          Clear All Filters
        </button>

        {activeFilterCount > 0 && (
          <div>{activeFilterCount} filters applied</div>
        )}
      </div>
    );
  };

  return MockDirectoryFilters;
};

// Test helper functions
const setupTest = () => {
  const mockUseAgencies = useAgencies as jest.Mock;
  const utils = render(<HomePage />);
  return { mockUseAgencies, ...utils };
};

const applyFilters = async (filters: {
  trades?: string[];
  states?: string[];
}) => {
  if (filters.trades) {
    for (const trade of filters.trades) {
      fireEvent.click(screen.getByText(trade));
    }
  }
  if (filters.states) {
    for (const state of filters.states) {
      fireEvent.click(screen.getByText(state));
    }
  }
};

const expectApiCallWith = (mockFn: jest.Mock, expectedFilters: Partial<FilterState> & { limit?: number; offset?: number }) => {
  expect(mockFn).toHaveBeenCalledWith(
    expect.objectContaining({
      ...expectedFilters,
      limit: 20,
      offset: 0,
    })
  );
};

const getResultCount = (container: HTMLElement): number => {
  const filterResults = container.querySelector(
    '[data-testid="filter-results"]'
  );
  if (!filterResults) return 0;
  const match = filterResults.textContent?.match(/(\d+)\s+results?/i);
  return match ? parseInt(match[1], 10) : 0;
};

// Helper to wait for router operations with specific parameters
const waitForRouterUpdate = async (
  mockReplace: jest.Mock,
  expectedParams: { trades?: string[]; states?: string[] }
) => {
  await waitFor(() => {
    // Get the most recent call
    const calls = mockReplace.mock.calls;
    if (calls.length === 0) {
      throw new Error('Router replace not called');
    }
    
    const lastCall = calls[calls.length - 1];
    const urlString = lastCall[0];
    
    // Check if URL contains expected parameters
    if (expectedParams.trades) {
      expectedParams.trades.forEach(trade => {
        if (!urlString.includes(`trades%5B%5D=${trade}`)) {
          throw new Error(`URL missing trade parameter: ${trade}`);
        }
      });
    }
    
    if (expectedParams.states) {
      expectedParams.states.forEach(state => {
        if (!urlString.includes(`states%5B%5D=${state}`)) {
          throw new Error(`URL missing state parameter: ${state}`);
        }
      });
    }
  });
};

describe('Filter Integration Tests', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the currentFilters state before each test
    currentFilters = {
      search: '',
      trades: [],
      states: [],
      perDiem: null,
      union: null,
      claimedOnly: false,
      companySize: [],
      focusAreas: [],
    };

    // Set up the mock DirectoryFilters for this test
    const DirectoryFilters = require('@/components/DirectoryFilters').default;
    DirectoryFilters.mockImplementation(createMockDirectoryFilters());

    mockSearchParams = new URLSearchParams();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });

    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    // Mock window.location for jsdom
    // jsdom doesn't allow location to be redefined, so we use a workaround
    // by mocking the methods we need
    const originalLocation = window.location;
    
    // @ts-ignore - TypeScript doesn't know about jsdom internals
    delete window.location;
    
    window.location = {
      ...originalLocation,
      reload: jest.fn(),
      href: '',
      pathname: '/',
      search: '',
      assign: jest.fn(),
      replace: jest.fn(),
      origin: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      hash: '',
      toString: () => 'http://localhost/',
    } as any;
  });

  describe('Trade Filter Integration', () => {
    it('should filter agencies by single trade', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      // Start with all agencies
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      const { rerender } = render(<HomePage />);

      // Click electrician filter
      const electricianFilter = screen.getByText('Electrician');
      fireEvent.click(electricianFilter);

      // Mock the API response with filtered data
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.electricians },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      rerender(<HomePage />);

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: '',
          trades: ['electrician'],
          states: [],
          limit: 20,
          offset: 0,
        });
      });

      // Verify filtered results
      expect(screen.getByTestId('agency-1')).toBeInTheDocument();
      expect(screen.getByTestId('agency-2')).toBeInTheDocument();
      expect(screen.queryByTestId('agency-3')).not.toBeInTheDocument();
    });

    it('should filter agencies by multiple trades (OR logic)', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      // Click multiple trade filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Plumber'));

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: '',
          trades: ['electrician', 'plumber'],
          states: [],
          limit: 20,
          offset: 0,
        });
      });
    });

    it('should convert trade names to slugs for API', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      // Simulate filter with complex trade name
      fireEvent.click(screen.getByText('Electrician'));

      await waitFor(() => {
        const lastCall =
          mockUseAgencies.mock.calls[mockUseAgencies.mock.calls.length - 1][0];
        expect(lastCall.trades).toEqual(['electrician']); // Slug format
      });
    });

    it('should update URL with trade filter parameters', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Carpenter'));

      await waitForRouterUpdate(mockReplace, {
        trades: ['electrician', 'carpenter']
      });
      
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringMatching(/trades%5B%5D=electrician.*trades%5B%5D=carpenter/),
        { scroll: false }
      );
    });
  });

  describe('State Filter Integration', () => {
    it('should filter agencies by single state', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      // Start with all agencies
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      const { rerender } = render(<HomePage />);

      // Click Texas filter
      fireEvent.click(screen.getByText('Texas'));

      // Mock the API response with Texas-only agencies
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.texas },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      rerender(<HomePage />);

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: '',
          trades: [],
          states: ['TX'],
          limit: 20,
          offset: 0,
        });
      });

      // Verify filtered results
      expect(screen.getByTestId('agency-1')).toBeInTheDocument();
      expect(screen.queryByTestId('agency-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('agency-3')).toBeInTheDocument();
    });

    it('should filter agencies by multiple states (OR logic)', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      // Click multiple state filters
      fireEvent.click(screen.getByText('Texas'));
      fireEvent.click(screen.getByText('California'));

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: '',
          trades: [],
          states: ['TX', 'CA'],
          limit: 20,
          offset: 0,
        });
      });
    });

    it('should use 2-letter state codes for API', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      fireEvent.click(screen.getByText('Texas'));
      fireEvent.click(screen.getByText('New York'));

      await waitFor(() => {
        const lastCall =
          mockUseAgencies.mock.calls[mockUseAgencies.mock.calls.length - 1][0];
        expect(lastCall.states).toEqual(['TX', 'NY']); // 2-letter codes
      });
    });

    it('should update URL with state filter parameters', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      fireEvent.click(screen.getByText('Texas'));
      fireEvent.click(screen.getByText('California'));

      await waitForRouterUpdate(mockReplace, {
        states: ['TX', 'CA']
      });
      
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringMatching(/states%5B%5D=TX.*states%5B%5D=CA/),
        { scroll: false }
      );
    });
  });

  describe('Combined Filter Logic', () => {
    it('should combine trade and state filters (AND logic)', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      // Filter result: only agencies with electricians in Texas
      const filteredAgencies = [mockAgencies.all[0]]; // Elite has electricians and is in Texas

      mockUseAgencies.mockReturnValue({
        data: { data: filteredAgencies },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      // Apply both filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Texas'));

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: '',
          trades: ['electrician'],
          states: ['TX'],
          limit: 20,
          offset: 0,
        });
      });

      // Only Elite should match (has electricians AND operates in Texas)
      expect(screen.getByTestId('agency-1')).toBeInTheDocument();
      expect(screen.queryByTestId('agency-2')).not.toBeInTheDocument(); // National has electricians but not in Texas
      expect(screen.queryByTestId('agency-3')).not.toBeInTheDocument(); // Texas Specialists in Texas but no electricians
    });

    it('should combine search with filters', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: [mockAgencies.all[0]] },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      // Add search
      const searchInput = screen.getByPlaceholderText(/Search agencies/);
      fireEvent.change(searchInput, { target: { value: 'elite' } });

      // Add filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Texas'));

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: 'elite',
          trades: ['electrician'],
          states: ['TX'],
          limit: 20,
          offset: 0,
        });
      });
    });

    it('should show correct filter count badge', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      // Apply multiple filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Plumber'));
      fireEvent.click(screen.getByText('Texas'));
      fireEvent.click(screen.getByText('California'));

      await waitFor(() => {
        // Should show total active filters (2 trades + 2 states = 4)
        expect(screen.getByText('4 filters applied')).toBeInTheDocument();
      });
    });

    it('should clear all filters', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      // Apply filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Texas'));

      // Clear all filters - use test ID for more reliable selection
      const clearButton = screen.getByTestId('clear-all-filters-button');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: '',
          trades: [],
          states: [],
          limit: 20,
          offset: 0,
        });
      });
    });
  });

  describe('Filter Loading States', () => {
    it('should show loading indicator while filters are being applied', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: true, // Validating means filters are being applied
      });

      render(<HomePage />);

      expect(screen.getByTestId('filter-loading')).toBeInTheDocument();
    });

    it('should update result count after filtering', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      // Start with all agencies
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      const { rerender } = render(<HomePage />);

      // Use more robust assertion for result count
      expect(screen.getByTestId('filter-results')).toHaveTextContent(
        /3\s+results?/i
      );
      // Also verify the actual data
      expect(mockUseAgencies).toHaveBeenCalledWith(expect.any(Object));
      expect(mockUseAgencies.mock.results[0].value.data.data).toHaveLength(3);

      // Apply filter
      fireEvent.click(screen.getByText('Electrician'));

      // Update with filtered results
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.electricians },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      rerender(<HomePage />);

      await waitFor(() => {
        // Use more robust assertion for result count
        expect(screen.getByTestId('filter-results')).toHaveTextContent(
          /2\s+results?/i
        );
        // Also verify the hook was called with filters
        expect(mockUseAgencies).toHaveBeenCalledWith(
          expect.objectContaining({
            trades: ['electrician'],
          })
        );
      });
    });
  });

  describe('Filter URL Persistence', () => {
    it('should initialize filters from URL on page load', () => {
      // Mock getAll method for array parameters
      mockSearchParams.getAll = jest.fn((key) => {
        if (key === 'trades[]') return ['electrician', 'plumber'];
        if (key === 'states[]') return ['TX'];
        return [];
      });
      mockSearchParams.get = jest.fn((key) => {
        if (key === 'search') return '';
        return null;
      });

      const mockUseAgencies = useAgencies as jest.Mock;
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      expect(mockUseAgencies).toHaveBeenCalledWith({
        search: '',
        trades: ['electrician', 'plumber'],
        states: ['TX'],
        limit: 20,
        offset: 0,
      });
    });

    it('should maintain filter state across navigation', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      // Apply filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Texas'));

      await waitForRouterUpdate(mockReplace, {
        trades: ['electrician'],
        states: ['TX']
      });
      
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringMatching(/trades%5B%5D=electrician.*states%5B%5D=TX/),
        { scroll: false }
      );
    });
  });

  describe('Complex Filter Scenarios', () => {
    it('should handle removing individual filters', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      // Add multiple filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Plumber'));
      fireEvent.click(screen.getByText('Carpenter'));

      // Remove middle filter
      fireEvent.click(screen.getByText('Plumber'));

      await waitFor(() => {
        const lastCall =
          mockUseAgencies.mock.calls[mockUseAgencies.mock.calls.length - 1][0];
        expect(lastCall.trades).toEqual(['electrician', 'carpenter']);
        expect(lastCall.trades).not.toContain('plumber');
      });
    });

    it('should handle rapid filter changes', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      // Rapidly toggle filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Electrician')); // Toggle off
      fireEvent.click(screen.getByText('Electrician')); // Toggle on
      fireEvent.click(screen.getByText('Plumber'));
      fireEvent.click(screen.getByText('Plumber')); // Toggle off

      await waitFor(() => {
        const lastCall =
          mockUseAgencies.mock.calls[mockUseAgencies.mock.calls.length - 1][0];
        expect(lastCall.trades).toEqual(['electrician']); // Only electrician should be on
      });
    });

    it('should handle edge case with no matching results', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: [] },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      // Apply very restrictive filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('New York'));

      await waitFor(() => {
        expect(screen.getByText('No agencies found')).toBeInTheDocument();
        expect(
          screen.getByText(/Try adjusting your criteria/)
        ).toBeInTheDocument();
      });
    });
  });
});
