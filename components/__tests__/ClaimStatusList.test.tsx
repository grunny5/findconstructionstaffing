/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@/lib/auth/auth-context';
import { ClaimStatusList } from '../ClaimStatusList';

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  },
}));

describe('ClaimStatusList', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
  };

  const mockClaimsPendingAndApproved = [
    {
      id: 'claim-1',
      agency_id: 'agency-1',
      user_id: mockUser.id,
      status: 'pending',
      business_email: 'user@agency1.com',
      phone_number: '+1-555-123-4567',
      position_title: 'CEO',
      verification_method: 'email',
      email_domain_verified: true,
      additional_notes: 'I am the owner',
      rejection_reason: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      agency: {
        id: 'agency-1',
        name: 'Test Staffing Agency',
        slug: 'test-staffing-agency',
        logo_url: 'https://example.com/logo.png',
      },
    },
    {
      id: 'claim-2',
      agency_id: 'agency-2',
      user_id: mockUser.id,
      status: 'approved',
      business_email: 'user@agency2.com',
      phone_number: '+1-555-987-6543',
      position_title: 'Manager',
      verification_method: 'phone',
      email_domain_verified: false,
      additional_notes: null,
      rejection_reason: null,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-14T10:00:00Z',
      agency: {
        id: 'agency-2',
        name: 'Construction Pros',
        slug: 'construction-pros',
        logo_url: null,
      },
    },
  ];

  const mockRejectedClaim = {
    id: 'claim-3',
    agency_id: 'agency-3',
    user_id: mockUser.id,
    status: 'rejected',
    business_email: 'user@fake.com',
    phone_number: '+1-555-111-2222',
    position_title: 'Owner',
    verification_method: 'manual',
    email_domain_verified: false,
    additional_notes: null,
    rejection_reason:
      'Email domain does not match agency website. Please provide additional verification.',
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-06T10:00:00Z',
    agency: {
      id: 'agency-3',
      name: 'Rejected Agency',
      slug: 'rejected-agency',
      logo_url: null,
    },
  };

  const mockUnderReviewClaim = {
    id: 'claim-4',
    agency_id: 'agency-4',
    user_id: mockUser.id,
    status: 'under_review',
    business_email: 'user@agency4.com',
    phone_number: '+1-555-333-4444',
    position_title: 'VP',
    verification_method: 'email',
    email_domain_verified: true,
    additional_notes: 'Under review test',
    rejection_reason: null,
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z',
    agency: {
      id: 'agency-4',
      name: 'Review Agency',
      slug: 'review-agency',
      logo_url: 'https://example.com/review-logo.png',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      ); // Never resolves

      render(<ClaimStatusList />);

      // Check for skeleton elements
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should render error message when fetch fails', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<ClaimStatusList />);

      await waitFor(() => {
        expect(
          screen.getByText('Unable to load claim requests')
        ).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should render error message when API returns non-ok response', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        expect(
          screen.getByText('Unable to load claim requests')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Failed to fetch claim requests')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should render empty state when user has no claims', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        expect(screen.getByText('No claim requests yet')).toBeInTheDocument();
        expect(
          screen.getByText(/Find an agency and submit a claim request/i)
        ).toBeInTheDocument();
        expect(screen.getByText('Browse Agencies')).toBeInTheDocument();
      });
    });

    it('should not fetch claims when user is null', () => {
      mockedUseAuth.mockReturnValue({
        user: null,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      render(<ClaimStatusList />);

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Claims Display', () => {
    it('should render claims with agency info and status', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockClaimsPendingAndApproved }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        // Check agency names
        expect(screen.getByText('Test Staffing Agency')).toBeInTheDocument();
        expect(screen.getByText('Construction Pros')).toBeInTheDocument();

        // Check statuses
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
      });
    });

    it('should display agency logo when available', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockClaimsPendingAndApproved[0]] }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        const logo = screen.getByAltText('Test Staffing Agency logo');
        expect(logo).toBeInTheDocument();
        expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
      });
    });

    it('should display placeholder when agency has no logo', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockClaimsPendingAndApproved[1]] }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        // Should show first letter of agency name
        expect(screen.getByText('C')).toBeInTheDocument();
      });
    });

    it('should format submitted date correctly', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockClaimsPendingAndApproved[0]] }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
      });
    });

    it('should display truncated claim ID', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockClaimsPendingAndApproved[0]] }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        // Should show first 8 characters + "..."
        expect(screen.getByText(/claim-1\.\.\./)).toBeInTheDocument();
      });
    });
  });

  describe('Status-Specific Rendering', () => {
    it('should show "Manage Agency" button for approved claims', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockClaimsPendingAndApproved[1]] }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        const manageButton = screen.getByText('Manage Agency');
        expect(manageButton).toBeInTheDocument();
        expect(manageButton.closest('a')).toHaveAttribute(
          'href',
          '/dashboard/agency/construction-pros'
        );
      });
    });

    it('should show "Resubmit" button and rejection reason for rejected claims', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockRejectedClaim] }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        // Check rejection reason is displayed
        expect(screen.getByText('Rejection Reason')).toBeInTheDocument();
        expect(
          screen.getByText(/Email domain does not match agency website/i)
        ).toBeInTheDocument();

        // Check resubmit button
        const resubmitButton = screen.getByText('Resubmit');
        expect(resubmitButton).toBeInTheDocument();
        expect(resubmitButton.closest('a')).toHaveAttribute(
          'href',
          '/claim/rejected-agency'
        );
      });
    });

    it('should render under_review status with correct badge', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockUnderReviewClaim] }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        expect(screen.getByText('Under Review')).toBeInTheDocument();
      });
    });

    it('should not show action buttons for pending claims', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockClaimsPendingAndApproved[0]] }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        expect(screen.queryByText('Manage Agency')).not.toBeInTheDocument();
        expect(screen.queryByText('Resubmit')).not.toBeInTheDocument();
      });
    });

    it('should not show action buttons for under_review claims', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockUnderReviewClaim] }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        expect(screen.queryByText('Manage Agency')).not.toBeInTheDocument();
        expect(screen.queryByText('Resubmit')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for claim articles', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockClaimsPendingAndApproved[0]] }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        const article = screen.getByRole('article', {
          name: /Claim request for Test Staffing Agency/i,
        });
        expect(article).toBeInTheDocument();
      });
    });

    it('should have accessible image alt text', async () => {
      mockedUseAuth.mockReturnValue({
        user: mockUser as any,
        profile: null,
      agencySlug: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshProfile: jest.fn(),
        isAdmin: false,
        isAgencyOwner: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockClaimsPendingAndApproved[0]] }),
      });

      render(<ClaimStatusList />);

      await waitFor(() => {
        const logo = screen.getByAltText('Test Staffing Agency logo');
        expect(logo).toBeInTheDocument();
      });
    });
  });
});
