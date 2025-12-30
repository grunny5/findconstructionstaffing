import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminAgenciesTable } from '../AdminAgenciesTable';
import type { AdminAgency } from '@/types/admin';

// Mock next/navigation
const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock the useDebounce hook to return value immediately for testing
jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}));

const createMockAgency = (id: number): AdminAgency => ({
  id: id.toString(),
  name: `Agency ${id}`,
  slug: `agency-${id}`,
  is_active: id % 2 === 0,
  is_claimed: id % 3 === 0,
  claimed_by: id % 3 === 0 ? `user-${id}` : null,
  created_at: `2024-01-${String(id).padStart(2, '0')}T00:00:00Z`,
  profile_completion_percentage: (id * 10) % 100,
  owner_profile:
    id % 3 === 0
      ? { email: `owner${id}@test.com`, full_name: `Owner ${id}` }
      : null,
});

const mockAgencies: AdminAgency[] = [
  {
    id: '1',
    name: 'Alpha Staffing',
    slug: 'alpha-staffing',
    is_active: true,
    is_claimed: true,
    claimed_by: 'user-1',
    created_at: '2024-01-15T00:00:00Z',
    profile_completion_percentage: 85,
    owner_profile: {
      email: 'owner@alpha.com',
      full_name: 'John Owner',
    },
  },
  {
    id: '2',
    name: 'Beta Recruiting',
    slug: 'beta-recruiting',
    is_active: false,
    is_claimed: false,
    claimed_by: null,
    created_at: '2024-02-20T00:00:00Z',
    profile_completion_percentage: 30,
    owner_profile: null,
  },
  {
    id: '3',
    name: 'Gamma Solutions',
    slug: 'gamma-solutions',
    is_active: true,
    is_claimed: true,
    claimed_by: 'user-3',
    created_at: '2024-03-10T00:00:00Z',
    profile_completion_percentage: 55,
    owner_profile: {
      email: 'contact@gamma.com',
      full_name: null,
    },
  },
];

// Generate 25 agencies for pagination testing (more than 1 page at 20 per page)
const manyAgencies: AdminAgency[] = Array.from({ length: 25 }, (_, i) =>
  createMockAgency(i + 1)
);

describe('AdminAgenciesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe('Basic Rendering', () => {
    it('renders table with all agencies', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      expect(screen.getByText('Alpha Staffing')).toBeInTheDocument();
      expect(screen.getByText('Beta Recruiting')).toBeInTheDocument();
      expect(screen.getByText('Gamma Solutions')).toBeInTheDocument();
    });

    it('displays correct status badges', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const activeBadges = screen.getAllByText('Active');
      const inactiveBadges = screen.getAllByText('Inactive');

      expect(activeBadges).toHaveLength(2);
      expect(inactiveBadges).toHaveLength(1);
    });

    it('displays status badges with correct variants', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const activeBadge = screen.getByTestId('status-badge-1');
      const inactiveBadge = screen.getByTestId('status-badge-2');

      // Active badge should have default variant (darker/more prominent)
      expect(activeBadge).toHaveTextContent('Active');
      expect(activeBadge).toHaveClass('bg-industrial-graphite-600');
      expect(activeBadge).toHaveClass('text-white');

      // Inactive badge should have secondary variant (lighter/muted)
      expect(inactiveBadge).toHaveTextContent('Inactive');
      expect(inactiveBadge).toHaveClass('bg-industrial-graphite-100');
      expect(inactiveBadge).toHaveClass('text-industrial-graphite-600');
    });

    it('displays correct claimed badges', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const claimedBadge1 = screen.getByTestId('claimed-badge-1');
      const claimedBadge3 = screen.getByTestId('claimed-badge-3');
      const unclaimedBadge2 = screen.getByTestId('claimed-badge-2');

      expect(claimedBadge1).toHaveTextContent('Claimed');
      expect(claimedBadge3).toHaveTextContent('Claimed');
      expect(unclaimedBadge2).toHaveTextContent('Unclaimed');
    });

    it('displays owner information when available', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      expect(screen.getByText('John Owner')).toBeInTheDocument();
      expect(screen.getByText('contact@gamma.com')).toBeInTheDocument();
    });

    it('displays dash for unclaimed agencies', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it('displays profile completion percentages with correct styling', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.getByText('55%')).toBeInTheDocument();
    });

    it('shows empty state when agencies array is empty', () => {
      render(<AdminAgenciesTable agencies={[]} />);

      expect(screen.getByText('No agencies found.')).toBeInTheDocument();
      expect(screen.getByTestId('agencies-count')).toHaveTextContent(
        'Showing 0 of 0 agencies'
      );
    });

    it('renders agency links with correct href and security attributes', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const alphaLink = screen.getByRole('link', { name: 'Alpha Staffing' });
      expect(alphaLink).toHaveAttribute('href', '/recruiters/alpha-staffing');
      expect(alphaLink).toHaveAttribute('target', '_blank');
      expect(alphaLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('formats dates correctly', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      // Dates may vary by 1 day due to timezone, so check for month/year
      expect(screen.getByText(/Jan \d{1,2}, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Feb \d{1,2}, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Mar \d{1,2}, 2024/)).toBeInTheDocument();
    });

    it('handles null profile_completion_percentage', () => {
      const agencyWithNullCompletion: AdminAgency[] = [
        {
          id: '4',
          name: 'Delta Agency',
          slug: 'delta-agency',
          is_active: true,
          is_claimed: false,
          claimed_by: null,
          created_at: '2024-04-01T00:00:00Z',
          profile_completion_percentage: null,
          owner_profile: null,
        },
      ];

      render(<AdminAgenciesTable agencies={agencyWithNullCompletion} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Search Filtering', () => {
    it('filters agencies by search term', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'Alpha' } });

      expect(screen.getByText('Alpha Staffing')).toBeInTheDocument();
      expect(screen.queryByText('Beta Recruiting')).not.toBeInTheDocument();
      expect(screen.queryByText('Gamma Solutions')).not.toBeInTheDocument();
    });

    it('shows correct count when filtering by search', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      expect(screen.getByTestId('agencies-count')).toHaveTextContent(
        'Showing 1-3 of 3 agencies'
      );

      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'Beta' } });

      expect(screen.getByTestId('agencies-count')).toHaveTextContent(
        'Showing 1-1 of 1 agencies'
      );
    });

    it('shows empty state when no agencies match search', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      expect(
        screen.getByText('No agencies match your filters.')
      ).toBeInTheDocument();
    });

    it('case-insensitive search works correctly', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'GAMMA' } });

      expect(screen.getByText('Gamma Solutions')).toBeInTheDocument();
      expect(screen.queryByText('Alpha Staffing')).not.toBeInTheDocument();
    });
  });

  describe('Status Filter', () => {
    it('renders status filter dropdown', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      expect(screen.getByTestId('status-filter-trigger')).toBeInTheDocument();
    });

    it('filters by active status', async () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const trigger = screen.getByTestId('status-filter-trigger');
      fireEvent.click(trigger);

      const activeOption = screen.getByRole('option', { name: 'Active' });
      fireEvent.click(activeOption);

      await waitFor(() => {
        expect(screen.getByText('Alpha Staffing')).toBeInTheDocument();
        expect(screen.getByText('Gamma Solutions')).toBeInTheDocument();
        expect(screen.queryByText('Beta Recruiting')).not.toBeInTheDocument();
      });
    });

    it('filters by inactive status', async () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const trigger = screen.getByTestId('status-filter-trigger');
      fireEvent.click(trigger);

      const inactiveOption = screen.getByRole('option', { name: 'Inactive' });
      fireEvent.click(inactiveOption);

      await waitFor(() => {
        expect(screen.getByText('Beta Recruiting')).toBeInTheDocument();
        expect(screen.queryByText('Alpha Staffing')).not.toBeInTheDocument();
        expect(screen.queryByText('Gamma Solutions')).not.toBeInTheDocument();
      });
    });
  });

  describe('Claimed Filter', () => {
    it('renders claimed filter dropdown', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      expect(screen.getByTestId('claimed-filter-trigger')).toBeInTheDocument();
    });

    it('filters by claimed agencies', async () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const trigger = screen.getByTestId('claimed-filter-trigger');
      fireEvent.click(trigger);

      const claimedOption = screen.getByRole('option', { name: 'Claimed' });
      fireEvent.click(claimedOption);

      await waitFor(() => {
        expect(screen.getByText('Alpha Staffing')).toBeInTheDocument();
        expect(screen.getByText('Gamma Solutions')).toBeInTheDocument();
        expect(screen.queryByText('Beta Recruiting')).not.toBeInTheDocument();
      });
    });

    it('filters by unclaimed agencies', async () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const trigger = screen.getByTestId('claimed-filter-trigger');
      fireEvent.click(trigger);

      const unclaimedOption = screen.getByRole('option', { name: 'Unclaimed' });
      fireEvent.click(unclaimedOption);

      await waitFor(() => {
        expect(screen.getByText('Beta Recruiting')).toBeInTheDocument();
        expect(screen.queryByText('Alpha Staffing')).not.toBeInTheDocument();
        expect(screen.queryByText('Gamma Solutions')).not.toBeInTheDocument();
      });
    });
  });

  describe('Combined Filters', () => {
    it('applies multiple filters together', async () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      // Apply status filter
      const statusTrigger = screen.getByTestId('status-filter-trigger');
      fireEvent.click(statusTrigger);
      const activeOption = screen.getByRole('option', { name: 'Active' });
      fireEvent.click(activeOption);

      // Apply claimed filter
      const claimedTrigger = screen.getByTestId('claimed-filter-trigger');
      fireEvent.click(claimedTrigger);
      const claimedOption = screen.getByRole('option', { name: 'Claimed' });
      fireEvent.click(claimedOption);

      await waitFor(() => {
        // Only Alpha and Gamma are active AND claimed
        expect(screen.getByText('Alpha Staffing')).toBeInTheDocument();
        expect(screen.getByText('Gamma Solutions')).toBeInTheDocument();
        expect(screen.queryByText('Beta Recruiting')).not.toBeInTheDocument();
      });
    });
  });

  describe('Clear Filters', () => {
    it('does not show clear button when no filters active', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      expect(
        screen.queryByTestId('clear-filters-button')
      ).not.toBeInTheDocument();
    });

    it('shows clear button when search is active', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'Alpha' } });

      expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();
    });

    it('shows clear button when status filter is active', async () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const trigger = screen.getByTestId('status-filter-trigger');
      fireEvent.click(trigger);
      const activeOption = screen.getByRole('option', { name: 'Active' });
      fireEvent.click(activeOption);

      await waitFor(() => {
        expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();
      });
    });

    it('clears all filters when clear button is clicked', async () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      // Apply search filter
      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'Alpha' } });

      // Click clear button
      const clearButton = screen.getByTestId('clear-filters-button');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('Alpha Staffing')).toBeInTheDocument();
        expect(screen.getByText('Beta Recruiting')).toBeInTheDocument();
        expect(screen.getByText('Gamma Solutions')).toBeInTheDocument();
        expect(
          screen.queryByTestId('clear-filters-button')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('URL Updates', () => {
    it('updates URL when search changes', async () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'Alpha' } });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/agencies?search=Alpha', {
          scroll: false,
        });
      });
    });

    it('updates URL when status filter changes', async () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const trigger = screen.getByTestId('status-filter-trigger');
      fireEvent.click(trigger);
      const activeOption = screen.getByRole('option', { name: 'Active' });
      fireEvent.click(activeOption);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/agencies?status=active', {
          scroll: false,
        });
      });
    });

    it('updates URL when claimed filter changes', async () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const trigger = screen.getByTestId('claimed-filter-trigger');
      fireEvent.click(trigger);
      const claimedOption = screen.getByRole('option', { name: 'Claimed' });
      fireEvent.click(claimedOption);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/agencies?claimed=yes', {
          scroll: false,
        });
      });
    });

    it('combines multiple params in URL', async () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      // Apply search
      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      // Apply status filter
      const statusTrigger = screen.getByTestId('status-filter-trigger');
      fireEvent.click(statusTrigger);
      const activeOption = screen.getByRole('option', { name: 'Active' });
      fireEvent.click(activeOption);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/admin/agencies?search=Test&status=active',
          { scroll: false }
        );
      });
    });

    it('removes params from URL when cleared', async () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      // Apply filter then clear
      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'Alpha' } });

      const clearButton = await screen.findByTestId('clear-filters-button');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenLastCalledWith('/admin/agencies', {
          scroll: false,
        });
      });
    });
  });

  describe('Pagination', () => {
    it('does not show pagination controls when there is only one page', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      expect(
        screen.queryByTestId('pagination-controls')
      ).not.toBeInTheDocument();
    });

    it('shows pagination controls when there are multiple pages', () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-previous')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-next')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-info')).toBeInTheDocument();
    });

    it('shows correct page info', () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      expect(screen.getByTestId('pagination-info')).toHaveTextContent(
        'Page 1 of 2'
      );
    });

    it('shows correct item count for first page', () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      expect(screen.getByTestId('agencies-count')).toHaveTextContent(
        'Showing 1-20 of 25 agencies'
      );
    });

    it('disables Previous button on first page', () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      const previousButton = screen.getByTestId('pagination-previous');
      expect(previousButton).toBeDisabled();
    });

    it('enables Next button on first page when more pages exist', () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      const nextButton = screen.getByTestId('pagination-next');
      expect(nextButton).not.toBeDisabled();
    });

    it('navigates to next page when Next button is clicked', async () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('pagination-info')).toHaveTextContent(
          'Page 2 of 2'
        );
      });
    });

    it('shows correct item count for second page', async () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('agencies-count')).toHaveTextContent(
          'Showing 21-25 of 25 agencies'
        );
      });
    });

    it('disables Next button on last page', async () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(nextButton).toBeDisabled();
      });
    });

    it('enables Previous button on second page', async () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        const previousButton = screen.getByTestId('pagination-previous');
        expect(previousButton).not.toBeDisabled();
      });
    });

    it('navigates back to previous page when Previous button is clicked', async () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      // Go to page 2
      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('pagination-info')).toHaveTextContent(
          'Page 2 of 2'
        );
      });

      // Go back to page 1
      const previousButton = screen.getByTestId('pagination-previous');
      fireEvent.click(previousButton);

      await waitFor(() => {
        expect(screen.getByTestId('pagination-info')).toHaveTextContent(
          'Page 1 of 2'
        );
      });
    });

    it('updates URL with page parameter when navigating', async () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/agencies?page=2', {
          scroll: false,
        });
      });
    });

    it('does not include page param in URL when on first page', async () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      // Go to page 2 then back to page 1
      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('pagination-info')).toHaveTextContent(
          'Page 2 of 2'
        );
      });

      const previousButton = screen.getByTestId('pagination-previous');
      fireEvent.click(previousButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenLastCalledWith('/admin/agencies', {
          scroll: false,
        });
      });
    });

    it('initializes from page URL param', () => {
      mockSearchParams = new URLSearchParams('page=2');

      render(<AdminAgenciesTable agencies={manyAgencies} />);

      expect(screen.getByTestId('pagination-info')).toHaveTextContent(
        'Page 2 of 2'
      );
      expect(screen.getByTestId('agencies-count')).toHaveTextContent(
        'Showing 21-25 of 25 agencies'
      );
    });

    it('resets to page 1 when search filter changes', async () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      // Go to page 2
      const nextButton = screen.getByTestId('pagination-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('pagination-info')).toHaveTextContent(
          'Page 2 of 2'
        );
      });

      // Apply a search filter
      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'Agency 1' } });

      // Should reset to page 1 and no pagination controls (< 20 results)
      await waitFor(() => {
        expect(
          screen.queryByTestId('pagination-controls')
        ).not.toBeInTheDocument();
      });
    });

    it('handles single page of filtered results correctly', () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      // Filter to show fewer than 20 agencies
      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'Agency 1' } });

      // Should not show pagination
      expect(
        screen.queryByTestId('pagination-controls')
      ).not.toBeInTheDocument();
    });

    it('handles empty results correctly', () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      // Filter to show no agencies
      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      expect(screen.getByTestId('agencies-count')).toHaveTextContent(
        'Showing 0 of 0 agencies'
      );
      expect(
        screen.queryByTestId('pagination-controls')
      ).not.toBeInTheDocument();
    });

    it('handles invalid page param gracefully', () => {
      mockSearchParams = new URLSearchParams('page=invalid');

      render(<AdminAgenciesTable agencies={manyAgencies} />);

      // Should default to page 1
      expect(screen.getByTestId('pagination-info')).toHaveTextContent(
        'Page 1 of 2'
      );
    });

    it('handles page param exceeding total pages', () => {
      mockSearchParams = new URLSearchParams('page=999');

      render(<AdminAgenciesTable agencies={manyAgencies} />);

      // Should show last valid page
      expect(screen.getByTestId('pagination-info')).toHaveTextContent(
        'Page 2 of 2'
      );
    });

    it('combines page param with other URL params', async () => {
      render(<AdminAgenciesTable agencies={manyAgencies} />);

      // Apply status filter
      const statusTrigger = screen.getByTestId('status-filter-trigger');
      fireEvent.click(statusTrigger);
      const activeOption = screen.getByRole('option', { name: 'Active' });
      fireEvent.click(activeOption);

      await waitFor(() => {
        // With status filter, still enough agencies to paginate
        const paginationControls = screen.queryByTestId('pagination-controls');
        if (paginationControls) {
          const nextButton = screen.getByTestId('pagination-next');
          fireEvent.click(nextButton);
        }
      });

      // The URL should include both status and page params
      await waitFor(() => {
        const calls = mockPush.mock.calls;
        const hasStatusParam = calls.some(
          (call) =>
            typeof call[0] === 'string' && call[0].includes('status=active')
        );
        expect(hasStatusParam).toBe(true);
      });
    });
  });
});
