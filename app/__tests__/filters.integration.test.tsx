/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HomePage from '../page';
import { useAgencies } from '@/hooks/use-agencies';
import { useRouter, useSearchParams } from 'next/navigation';
import { allTrades, allStates } from '@/lib/mock-data';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock the useAgencies hook
jest.mock('@/hooks/use-agencies');

// Mock components
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@/components/AgencyCard', () => ({
  __esModule: true,
  default: ({ agency }: { agency: any }) => (
    <div data-testid={`agency-${agency.id}`}>
      <h3>{agency.name}</h3>
      <div data-testid={`trades-${agency.id}`}>
        {agency.trades.map((t: any) => t.name).join(', ')}
      </div>
      <div data-testid={`regions-${agency.id}`}>
        {agency.regions.map((r: any) => r.name).join(', ')}
      </div>
    </div>
  )
}));

jest.mock('@/components/AgencyCardSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="skeleton">Loading...</div>
}));

// Mock DirectoryFilters with actual functionality
jest.mock('@/components/DirectoryFilters', () => ({
  __esModule: true,
  default: ({ onFiltersChange, totalResults, isLoading }: any) => {
    const handleTradeFilter = (trade: string) => {
      onFiltersChange((prev: any) => ({
        ...prev,
        trades: prev.trades.includes(trade) 
          ? prev.trades.filter((t: string) => t !== trade)
          : [...prev.trades, trade]
      }));
    };

    const handleStateFilter = (state: string) => {
      onFiltersChange((prev: any) => ({
        ...prev,
        states: prev.states.includes(state)
          ? prev.states.filter((s: string) => s !== state)
          : [...prev.states, state]
      }));
    };

    return (
      <div data-testid="directory-filters">
        <div data-testid="filter-results">{totalResults} results</div>
        {isLoading && <div data-testid="filter-loading">Loading...</div>}
        
        <div data-testid="trade-filters">
          <button onClick={() => handleTradeFilter('electrician')}>Electrician</button>
          <button onClick={() => handleTradeFilter('plumber')}>Plumber</button>
          <button onClick={() => handleTradeFilter('carpenter')}>Carpenter</button>
        </div>
        
        <div data-testid="state-filters">
          <button onClick={() => handleStateFilter('TX')}>Texas</button>
          <button onClick={() => handleStateFilter('CA')}>California</button>
          <button onClick={() => handleStateFilter('NY')}>New York</button>
        </div>
      </div>
    );
  }
}));

const mockAgencies = {
  all: [
    {
      id: '1',
      name: 'Elite Construction Staffing',
      slug: 'elite-construction-staffing',
      description: 'Premier construction staffing',
      trades: [
        { id: 't1', name: 'Electrician', slug: 'electrician' },
        { id: 't2', name: 'Plumber', slug: 'plumber' }
      ],
      regions: [
        { id: 'r1', name: 'Texas', code: 'TX' },
        { id: 'r2', name: 'California', code: 'CA' }
      ],
      rating: 4.5,
      reviewCount: 25,
      projectCount: 150,
      featured: true,
      verified: true
    },
    {
      id: '2',
      name: 'National Staffing Solutions',
      slug: 'national-staffing-solutions',
      description: 'Nationwide construction staffing',
      trades: [
        { id: 't3', name: 'Carpenter', slug: 'carpenter' },
        { id: 't1', name: 'Electrician', slug: 'electrician' }
      ],
      regions: [
        { id: 'r3', name: 'New York', code: 'NY' },
        { id: 'r2', name: 'California', code: 'CA' }
      ],
      rating: 4.2,
      reviewCount: 45,
      projectCount: 200,
      featured: false,
      verified: true
    },
    {
      id: '3',
      name: 'Texas Trade Specialists',
      slug: 'texas-trade-specialists',
      description: 'Texas-focused staffing',
      trades: [
        { id: 't2', name: 'Plumber', slug: 'plumber' }
      ],
      regions: [
        { id: 'r1', name: 'Texas', code: 'TX' }
      ],
      rating: 4.0,
      reviewCount: 20,
      projectCount: 80,
      featured: false,
      verified: true
    }
  ],
  electricians: [
    {
      id: '1',
      name: 'Elite Construction Staffing',
      slug: 'elite-construction-staffing',
      description: 'Premier construction staffing',
      trades: [
        { id: 't1', name: 'Electrician', slug: 'electrician' },
        { id: 't2', name: 'Plumber', slug: 'plumber' }
      ],
      regions: [
        { id: 'r1', name: 'Texas', code: 'TX' },
        { id: 'r2', name: 'California', code: 'CA' }
      ],
      rating: 4.5,
      reviewCount: 25,
      projectCount: 150,
      featured: true,
      verified: true
    },
    {
      id: '2',
      name: 'National Staffing Solutions',
      slug: 'national-staffing-solutions',
      description: 'Nationwide construction staffing',
      trades: [
        { id: 't3', name: 'Carpenter', slug: 'carpenter' },
        { id: 't1', name: 'Electrician', slug: 'electrician' }
      ],
      regions: [
        { id: 'r3', name: 'New York', code: 'NY' },
        { id: 'r2', name: 'California', code: 'CA' }
      ],
      rating: 4.2,
      reviewCount: 45,
      projectCount: 200,
      featured: false,
      verified: true
    }
  ],
  texas: [
    {
      id: '1',
      name: 'Elite Construction Staffing',
      slug: 'elite-construction-staffing',
      description: 'Premier construction staffing',
      trades: [
        { id: 't1', name: 'Electrician', slug: 'electrician' },
        { id: 't2', name: 'Plumber', slug: 'plumber' }
      ],
      regions: [
        { id: 'r1', name: 'Texas', code: 'TX' },
        { id: 'r2', name: 'California', code: 'CA' }
      ],
      rating: 4.5,
      reviewCount: 25,
      projectCount: 150,
      featured: true,
      verified: true
    },
    {
      id: '3',
      name: 'Texas Trade Specialists',
      slug: 'texas-trade-specialists',
      description: 'Texas-focused staffing',
      trades: [
        { id: 't2', name: 'Plumber', slug: 'plumber' }
      ],
      regions: [
        { id: 'r1', name: 'Texas', code: 'TX' }
      ],
      rating: 4.0,
      reviewCount: 20,
      projectCount: 80,
      featured: false,
      verified: true
    }
  ]
};

describe('Filter Integration Tests', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSearchParams = new URLSearchParams();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace
    });
    
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: jest.fn() }
    });
  });

  describe('Trade Filter Integration', () => {
    it('should filter agencies by single trade', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;
      
      // Start with all agencies
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false
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
        isValidating: false
      });

      rerender(<HomePage />);

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: '',
          trades: ['electrician'],
          states: []
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
        isValidating: false
      });

      render(<HomePage />);

      // Click multiple trade filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Plumber'));

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: '',
          trades: ['electrician', 'plumber'],
          states: []
        });
      });
    });

    it('should convert trade names to slugs for API', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;
      
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false
      });

      render(<HomePage />);

      // Simulate filter with complex trade name
      fireEvent.click(screen.getByText('Electrician'));

      await waitFor(() => {
        const lastCall = mockUseAgencies.mock.calls[mockUseAgencies.mock.calls.length - 1][0];
        expect(lastCall.trades).toEqual(['electrician']); // Slug format
      });
    });

    it('should update URL with trade filter parameters', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;
      
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false
      });

      render(<HomePage />);

      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Carpenter'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('trades[]=electrician'),
          expect.any(Object)
        );
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('trades[]=carpenter'),
          expect.any(Object)
        );
      });
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
        isValidating: false
      });

      const { rerender } = render(<HomePage />);

      // Click Texas filter
      fireEvent.click(screen.getByText('Texas'));

      // Mock the API response with Texas-only agencies
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.texas },
        error: null,
        isLoading: false,
        isValidating: false
      });

      rerender(<HomePage />);

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: '',
          trades: [],
          states: ['TX']
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
        isValidating: false
      });

      render(<HomePage />);

      // Click multiple state filters
      fireEvent.click(screen.getByText('Texas'));
      fireEvent.click(screen.getByText('California'));

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: '',
          trades: [],
          states: ['TX', 'CA']
        });
      });
    });

    it('should use 2-letter state codes for API', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;
      
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false
      });

      render(<HomePage />);

      fireEvent.click(screen.getByText('Texas'));
      fireEvent.click(screen.getByText('New York'));

      await waitFor(() => {
        const lastCall = mockUseAgencies.mock.calls[mockUseAgencies.mock.calls.length - 1][0];
        expect(lastCall.states).toEqual(['TX', 'NY']); // 2-letter codes
      });
    });

    it('should update URL with state filter parameters', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;
      
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false
      });

      render(<HomePage />);

      fireEvent.click(screen.getByText('Texas'));
      fireEvent.click(screen.getByText('California'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('states[]=TX'),
          expect.any(Object)
        );
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('states[]=CA'),
          expect.any(Object)
        );
      });
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
        isValidating: false
      });

      render(<HomePage />);

      // Apply both filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Texas'));

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: '',
          trades: ['electrician'],
          states: ['TX']
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
        isValidating: false
      });

      render(<HomePage />);

      // Add search
      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'elite' } });

      // Add filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Texas'));

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: 'elite',
          trades: ['electrician'],
          states: ['TX']
        });
      });
    });

    it('should show correct filter count badge', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;
      
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false
      });

      render(<HomePage />);

      // Apply multiple filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Plumber'));
      fireEvent.click(screen.getByText('Texas'));
      fireEvent.click(screen.getByText('California'));

      await waitFor(() => {
        // Should show total active filters
        expect(screen.getByText(/4 filters applied/)).toBeInTheDocument();
      });
    });

    it('should clear all filters', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;
      
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false
      });

      render(<HomePage />);

      // Apply filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Texas'));

      // Clear all filters
      const clearButton = screen.getByText('Clear All Filters');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith({
          search: '',
          trades: [],
          states: []
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
        isValidating: true // Validating means filters are being applied
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
        isValidating: false
      });

      const { rerender } = render(<HomePage />);

      expect(screen.getByTestId('filter-results')).toHaveTextContent('3 results');

      // Apply filter
      fireEvent.click(screen.getByText('Electrician'));

      // Update with filtered results
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.electricians },
        error: null,
        isLoading: false,
        isValidating: false
      });

      rerender(<HomePage />);

      await waitFor(() => {
        expect(screen.getByTestId('filter-results')).toHaveTextContent('2 results');
      });
    });
  });

  describe('Filter URL Persistence', () => {
    it('should initialize filters from URL on page load', () => {
      mockSearchParams.append('trades[]', 'electrician');
      mockSearchParams.append('trades[]', 'plumber');
      mockSearchParams.append('states[]', 'TX');
      
      const mockUseAgencies = useAgencies as jest.Mock;
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false
      });

      render(<HomePage />);

      expect(mockUseAgencies).toHaveBeenCalledWith({
        search: '',
        trades: ['electrician', 'plumber'],
        states: ['TX']
      });
    });

    it('should maintain filter state across navigation', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;
      
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false
      });

      render(<HomePage />);

      // Apply filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Texas'));

      await waitFor(() => {
        const calls = mockReplace.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall).toContain('trades[]=electrician');
        expect(lastCall).toContain('states[]=TX');
      });
    });
  });

  describe('Complex Filter Scenarios', () => {
    it('should handle removing individual filters', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;
      
      mockUseAgencies.mockReturnValue({
        data: { data: mockAgencies.all },
        error: null,
        isLoading: false,
        isValidating: false
      });

      render(<HomePage />);

      // Add multiple filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Plumber'));
      fireEvent.click(screen.getByText('Carpenter'));

      // Remove middle filter
      fireEvent.click(screen.getByText('Plumber'));

      await waitFor(() => {
        const lastCall = mockUseAgencies.mock.calls[mockUseAgencies.mock.calls.length - 1][0];
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
        isValidating: false
      });

      render(<HomePage />);

      // Rapidly toggle filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('Electrician')); // Toggle off
      fireEvent.click(screen.getByText('Electrician')); // Toggle on
      fireEvent.click(screen.getByText('Plumber'));
      fireEvent.click(screen.getByText('Plumber')); // Toggle off

      await waitFor(() => {
        const lastCall = mockUseAgencies.mock.calls[mockUseAgencies.mock.calls.length - 1][0];
        expect(lastCall.trades).toEqual(['electrician']); // Only electrician should be on
      });
    });

    it('should handle edge case with no matching results', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;
      
      mockUseAgencies.mockReturnValue({
        data: { data: [] },
        error: null,
        isLoading: false,
        isValidating: false
      });

      render(<HomePage />);

      // Apply very restrictive filters
      fireEvent.click(screen.getByText('Electrician'));
      fireEvent.click(screen.getByText('New York'));

      await waitFor(() => {
        expect(screen.getByText('No agencies found')).toBeInTheDocument();
        expect(screen.getByText(/Try adjusting your criteria/)).toBeInTheDocument();
      });
    });
  });
});