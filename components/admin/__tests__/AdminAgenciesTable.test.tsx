import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminAgenciesTable } from '../AdminAgenciesTable';
import type { AdminAgency } from '@/app/(app)/admin/agencies/page';

// Mock next/navigation
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

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

describe('AdminAgenciesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.delete('search');
    mockSearchParams.delete('status');
    mockSearchParams.delete('claimed');
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

    it('renders agency links with correct href', () => {
      render(<AdminAgenciesTable agencies={mockAgencies} />);

      const alphaLink = screen.getByRole('link', { name: 'Alpha Staffing' });
      expect(alphaLink).toHaveAttribute('href', '/recruiters/alpha-staffing');
      expect(alphaLink).toHaveAttribute('target', '_blank');
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
        'Showing 3 of 3 agencies'
      );

      const searchInput = screen.getByTestId('agency-search-input');
      fireEvent.change(searchInput, { target: { value: 'Beta' } });

      expect(screen.getByTestId('agencies-count')).toHaveTextContent(
        'Showing 1 of 3 agencies'
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
        expect(mockPush).toHaveBeenCalledWith('?search=Alpha', {
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
        expect(mockPush).toHaveBeenCalledWith('?status=active', {
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
        expect(mockPush).toHaveBeenCalledWith('?claimed=yes', {
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
        expect(mockPush).toHaveBeenCalledWith('?search=Test&status=active', {
          scroll: false,
        });
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
});
