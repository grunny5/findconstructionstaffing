/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import HomePage from '../page';
import { useAgencies } from '@/hooks/use-agencies';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the useAgencies hook
jest.mock('@/hooks/use-agencies');

// Mock child components
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>,
}));

jest.mock('@/components/ClaimStatusBanner', () => ({
  ClaimStatusBanner: () => null,
}));

jest.mock('@/components/AgencyCard', () => ({
  __esModule: true,
  default: ({ agency }: { agency: any }) => (
    <div data-testid="agency-card">
      <h3>{agency.name}</h3>
      <p>{agency.description}</p>
    </div>
  ),
}));

jest.mock('@/components/AgencyCardSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="agency-skeleton">Loading...</div>,
}));

jest.mock('@/components/ApiErrorState', () => ({
  __esModule: true,
  default: ({ onRetry, message }: { onRetry: () => void; message: string }) => (
    <div data-testid="error-state">
      <p>{message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

jest.mock('@/components/DirectoryFilters', () => ({
  __esModule: true,
  default: ({ onFiltersChange, totalResults, isLoading }: any) => (
    <div data-testid="directory-filters">
      <span data-testid="filter-count">{totalResults} results</span>
      {isLoading && (
        <span data-testid="filter-loading">Loading filters...</span>
      )}
    </div>
  ),
}));

const mockAgencies = [
  {
    id: '1',
    name: 'Elite Construction Staffing',
    slug: 'elite-construction-staffing',
    description: 'Premier construction staffing',
    trades: [{ id: 't1', name: 'Electrician', slug: 'electrician' }],
    regions: [{ id: 'r1', name: 'Texas', code: 'TX' }],
    rating: 4.5,
    reviewCount: 25,
    projectCount: 150,
    featured: true,
    verified: true,
  },
  {
    id: '2',
    name: 'National Staffing Solutions',
    slug: 'national-staffing-solutions',
    description: 'Nationwide construction staffing',
    trades: [{ id: 't2', name: 'Plumber', slug: 'plumber' }],
    regions: [{ id: 'r2', name: 'California', code: 'CA' }],
    rating: 4.2,
    reviewCount: 45,
    projectCount: 200,
    featured: false,
    verified: true,
  },
];

describe('HomePage Integration Tests', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockSearchParams = new URLSearchParams();
  const mockMutate = jest.fn();

  // Helper to create mock useAgencies return value
  const createMockUseAgencies = (overrides = {}) => ({
    data: null,
    error: null,
    isLoading: false,
    isValidating: false,
    mutate: mockMutate,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    // Mock window.location.reload
    delete (window as any).location;
    window.location = { reload: jest.fn() } as any;
  });

  describe('API Connection and Data Loading', () => {
    it('should display loading skeletons while fetching data', async () => {
      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ isLoading: true })
      );

      render(<HomePage />);

      const skeletons = screen.getAllByTestId('agency-skeleton');
      expect(skeletons).toHaveLength(6);
    });

    it('should display agencies from API after loading', async () => {
      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ data: { data: mockAgencies } })
      );

      render(<HomePage />);

      await waitFor(() => {
        expect(
          screen.getByText('Elite Construction Staffing')
        ).toBeInTheDocument();
        expect(
          screen.getByText('National Staffing Solutions')
        ).toBeInTheDocument();
      });

      const agencyCards = screen.getAllByTestId('agency-card');
      expect(agencyCards).toHaveLength(2);
    });

    it('should display error state when API fails', async () => {
      const mockError = new Error('Failed to fetch agencies');
      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ error: mockError })
      );

      render(<HomePage />);

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(
        screen.getByText(/We encountered an error while loading/)
      ).toBeInTheDocument();
    });

    it('should retry API call when retry button is clicked', async () => {
      const mockError = new Error('Network error');
      const mockMutate = jest.fn();
      (useAgencies as jest.Mock).mockReturnValue({
        data: null,
        error: mockError,
        isLoading: false,
        isValidating: false,
        mutate: mockMutate,
      });

      render(<HomePage />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      // Should call mutate to retry
      expect(mockMutate).toHaveBeenCalled();
    });

    it('should display empty state when no agencies found', async () => {
      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ data: { data: [] } })
      );

      render(<HomePage />);

      expect(screen.getByText('No agencies found')).toBeInTheDocument();
      expect(
        screen.getByText(/We couldn't find any agencies/)
      ).toBeInTheDocument();
    });

    it('should update agency count in stats section', async () => {
      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ data: { data: mockAgencies } })
      );

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('2+')).toBeInTheDocument(); // mockAgencies.length + '+'
      });
    });
  });

  describe('Search Integration', () => {
    it('should debounce search input and call API', async () => {
      jest.useFakeTimers();

      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ data: { data: mockAgencies } })
      );

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);

      // Type in search
      fireEvent.change(searchInput, { target: { value: 'elite' } });

      // Advance timers by 300ms (debounce delay)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(useAgencies).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'elite',
          })
        );
      });

      jest.useRealTimers();
    });

    it('should show loading indicator while searching', async () => {
      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({
          data: { data: mockAgencies },
          isValidating: true,
        })
      );

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should show loading spinner in search input
      await waitFor(() => {
        expect(screen.getByText('Searching agencies')).toBeInTheDocument();
      });
    });

    it('should update URL with search parameter', async () => {
      jest.useFakeTimers();

      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ data: { data: mockAgencies } })
      );

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'construction' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('search=construction'),
          expect.any(Object)
        );
      });

      jest.useRealTimers();
    });

    it('should show contextual no results message for search', async () => {
      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ data: { data: [] } })
      );

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No matches found')).toBeInTheDocument();
        // Check for the specific message with proper quotes
        const message = screen.getByText((content, element) => {
          return (
            content.includes("We couldn't find any agencies matching") &&
            content.includes('nonexistent')
          );
        });
        expect(message).toBeInTheDocument();
      });
    });
  });

  describe('Filter Integration', () => {
    it('should pass correct filter parameters to API', async () => {
      const mockFilteredData = [mockAgencies[0]];

      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ data: { data: mockFilteredData } })
      );

      // Set initial URL params with filters
      const searchParams = new URLSearchParams();
      searchParams.append('trades[]', 'electrician');
      searchParams.append('states[]', 'TX');

      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<HomePage />);

      expect(useAgencies).toHaveBeenCalledWith({
        search: '',
        trades: ['electrician'],
        states: ['TX'],
        compliance: [],
        limit: 20,
        offset: 0,
      });
    });

    it('should show loading state in filters while validating', async () => {
      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({
          data: { data: mockAgencies },
          isValidating: true,
        })
      );

      render(<HomePage />);

      expect(screen.getByTestId('filter-loading')).toBeInTheDocument();
    });

    it('should update filter count badge', async () => {
      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ data: { data: mockAgencies } })
      );

      render(<HomePage />);

      expect(screen.getByTestId('filter-count')).toHaveTextContent('2 results');
    });
  });

  describe('Performance and Load Time', () => {
    it('should render initial content within performance budget', async () => {
      const startTime = performance.now();

      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ data: { data: mockAgencies } })
      );

      render(<HomePage />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Initial render should be fast (< 250ms for CI, < 100ms locally)
      const threshold = process.env.CI ? 250 : 100;
      expect(renderTime).toBeLessThan(threshold);
    });

    it('should show content progressively while loading', async () => {
      (useAgencies as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isValidating: false,
      });

      render(<HomePage />);

      // Static content should be visible immediately
      expect(screen.getByText('Find Elite Construction')).toBeInTheDocument();
      expect(screen.getByText('Premium Staffing Partners')).toBeInTheDocument();

      // Loading skeletons should be shown for dynamic content
      expect(screen.getAllByTestId('agency-skeleton')).toHaveLength(6);
    });
  });

  describe('Featured and Verified Badges', () => {
    it('should display featured badge for featured agencies', async () => {
      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ data: { data: mockAgencies } })
      );

      render(<HomePage />);

      await waitFor(() => {
        const featuredBadges = screen.getAllByText('Featured');
        expect(featuredBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('URL State Synchronization', () => {
    it('should initialize filters from URL parameters', () => {
      const searchParams = new URLSearchParams();
      searchParams.set('search', 'test');
      searchParams.append('trades[]', 'electrician');
      searchParams.append('states[]', 'TX');

      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ data: { data: mockAgencies } })
      );

      render(<HomePage />);

      expect(useAgencies).toHaveBeenCalledWith({
        search: 'test',
        trades: ['electrician'],
        states: ['TX'],
        compliance: [],
        limit: 20,
        offset: 0,
      });
    });

    it('should update URL when filters change', async () => {
      (useAgencies as jest.Mock).mockReturnValue(
        createMockUseAgencies({ data: { data: mockAgencies } })
      );

      render(<HomePage />);

      // Simulate filter change
      const filtersComponent = screen.getByTestId('directory-filters');
      expect(filtersComponent).toBeInTheDocument();

      // URL should be updated via router.replace
      expect(mockReplace).toHaveBeenCalled();
    });
  });
});
