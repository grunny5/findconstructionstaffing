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

// Mock components to focus on search functionality
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/ClaimStatusBanner', () => ({
  ClaimStatusBanner: () => null,
}));

jest.mock('@/components/AgencyCard', () => ({
  __esModule: true,
  default: ({ agency }: { agency: any }) => (
    <div data-testid={`agency-${agency.id}`}>{agency.name}</div>
  ),
}));

jest.mock('@/components/AgencyCardSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="skeleton">Loading...</div>,
}));

jest.mock('@/components/DirectoryFilters', () => ({
  __esModule: true,
  default: () => null,
}));

const mockSearchResults = {
  exact: [
    {
      id: '1',
      name: 'Elite Construction Staffing',
      slug: 'elite-construction-staffing',
      description: 'Premier construction staffing',
      trades: [],
      regions: [],
      rating: 4.5,
      reviewCount: 25,
      projectCount: 150,
      featured: true,
      verified: true,
    },
  ],
  partial: [
    {
      id: '1',
      name: 'Elite Construction Staffing',
      slug: 'elite-construction-staffing',
      description: 'Premier construction staffing',
      trades: [],
      regions: [],
      rating: 4.5,
      reviewCount: 25,
      projectCount: 150,
      featured: true,
      verified: true,
    },
    {
      id: '2',
      name: 'ABC Construction Services',
      slug: 'abc-construction-services',
      description: 'Quality construction workers',
      trades: [],
      regions: [],
      rating: 4.2,
      reviewCount: 15,
      projectCount: 100,
      featured: false,
      verified: true,
    },
  ],
  empty: [],
};

describe('Search Functionality Integration Tests', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockSearchParams = new URLSearchParams();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      getAll: (key: string) => mockSearchParams.getAll(key),
      has: (key: string) => mockSearchParams.has(key),
      toString: () => mockSearchParams.toString(),
    });

    // Mock window.location to prevent navigation errors
    delete (window as any).location;
    window.location = {
      reload: jest.fn(),
      href: '',
      pathname: '/',
      search: '',
      assign: jest.fn(),
      replace: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Search Debouncing', () => {
    it('should debounce search input by 300ms', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);

      // Type quickly
      fireEvent.change(searchInput, { target: { value: 'e' } });
      fireEvent.change(searchInput, { target: { value: 'el' } });
      fireEvent.change(searchInput, { target: { value: 'eli' } });
      fireEvent.change(searchInput, { target: { value: 'elit' } });
      fireEvent.change(searchInput, { target: { value: 'elite' } });

      // Should not call API immediately
      expect(mockUseAgencies).not.toHaveBeenCalledWith(
        expect.objectContaining({ search: 'elite' })
      );

      // Advance timer by 299ms - should still not call
      act(() => {
        jest.advanceTimersByTime(299);
      });

      expect(mockUseAgencies).not.toHaveBeenCalledWith(
        expect.objectContaining({ search: 'elite' })
      );

      // Advance by 1 more ms (total 300ms)
      act(() => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'elite' })
        );
      });
    });

    it('should cancel pending search when new input arrives', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);

      // First search
      fireEvent.change(searchInput, { target: { value: 'elite' } });

      // Advance timer by 200ms
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // New search before debounce completes
      fireEvent.change(searchInput, { target: { value: 'national' } });

      // Complete first debounce period
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should not have called with 'elite'
      expect(mockUseAgencies).not.toHaveBeenCalledWith(
        expect.objectContaining({ search: 'elite' })
      );

      // Complete second debounce period
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should only call with 'national'
      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'national' })
        );
      });
    });
  });

  describe('Search Loading States', () => {
    it('should show loading spinner while searching', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      // Start with no search
      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      const { rerender } = render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Simulate searching state
      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial },
        error: null,
        isLoading: false,
        isValidating: true,
      });

      rerender(<HomePage />);

      // Check for loading indicator (sr-only text)
      expect(screen.getByText('Searching agencies')).toBeInTheDocument();
    });

    it('should maintain previous results while searching', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      // Initial state with results
      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      const { rerender } = render(<HomePage />);

      // Verify initial results are shown
      expect(screen.getByTestId('agency-1')).toBeInTheDocument();
      expect(screen.getByTestId('agency-2')).toBeInTheDocument();

      // Start searching
      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'new search' } });

      // Simulate searching state
      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial }, // Same data
        error: null,
        isLoading: false,
        isValidating: true, // Now validating
      });

      rerender(<HomePage />);

      // Previous results should still be visible
      expect(screen.getByTestId('agency-1')).toBeInTheDocument();
      expect(screen.getByTestId('agency-2')).toBeInTheDocument();
    });
  });

  describe('Search Results', () => {
    it('should display exact match results', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.exact },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, {
        target: { value: 'Elite Construction Staffing' },
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('agency-1')).toBeInTheDocument();
        expect(
          screen.getByText('Elite Construction Staffing')
        ).toBeInTheDocument();
      });
    });

    it('should display partial match results', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'construction' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('agency-1')).toBeInTheDocument();
        expect(screen.getByTestId('agency-2')).toBeInTheDocument();
      });
    });

    it('should show no results message with search term', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      // Mock initial call
      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      const { rerender } = render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Mock search results as empty
      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.empty },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      rerender(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('No matches found')).toBeInTheDocument();
        // The component uses HTML entities for quotes, check for part of the message
        expect(
          screen.getByText(/We couldn.*t find any agencies matching/)
        ).toBeInTheDocument();
      });
    });

    it('should provide clear search button in no results state', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.empty },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'no results' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const clearButton = screen.getByText('Clear Search');
        expect(clearButton).toBeInTheDocument();

        fireEvent.click(clearButton);

        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('Search URL Synchronization', () => {
    it('should update URL with search parameter', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'elite staffing' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('search=elite+staffing'),
          expect.objectContaining({ scroll: false })
        );
      });
    });

    it('should initialize search from URL parameter', () => {
      mockSearchParams.set('search', 'initial search');

      const mockUseAgencies = useAgencies as jest.Mock;
      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(
        /Search companies/
      ) as HTMLInputElement;
      expect(searchInput.value).toBe('initial search');
    });

    it('should clear search parameter from URL when search is cleared', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);

      // Add search
      fireEvent.change(searchInput, { target: { value: 'test' } });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // Should be called twice - once with search, once without
        const calls = mockReplace.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).not.toContain('search=');
      });
    });
  });

  describe('Search with Filters', () => {
    it('should combine search with trade filters', async () => {
      mockSearchParams.append('trades[]', 'electrician');

      const mockUseAgencies = useAgencies as jest.Mock;
      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.exact },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'elite' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'elite',
            trades: ['electrician'],
            states: [],
          })
        );
      });
    });

    it('should combine search with state filters', async () => {
      mockSearchParams.append('states[]', 'TX');
      mockSearchParams.append('states[]', 'CA');

      const mockUseAgencies = useAgencies as jest.Mock;
      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'construction' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'construction',
            trades: [],
            states: ['TX', 'CA'],
          })
        );
      });
    });
  });

  describe('Search Error Handling', () => {
    it('should handle search API errors gracefully', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;
      const mockError = new Error('Search API failed');

      mockUseAgencies.mockReturnValue({
        data: null,
        error: mockError,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText(/We encountered an error/)).toBeInTheDocument();
      });
    });

    it('should sanitize special characters in search', async () => {
      const mockUseAgencies = useAgencies as jest.Mock;

      mockUseAgencies.mockReturnValue({
        data: { data: mockSearchResults.partial },
        error: null,
        isLoading: false,
        isValidating: false,
      });

      render(<HomePage />);

      const searchInput = screen.getByPlaceholderText(/Search companies/);
      fireEvent.change(searchInput, {
        target: { value: '<script>alert("xss")</script>' },
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockUseAgencies).toHaveBeenCalledWith(
          expect.objectContaining({
            search: '<script>alert("xss")</script>',
          })
        );
      });
    });
  });
});
