/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/lib/auth/auth-context';
import { ClaimStatusBanner } from '../ClaimStatusBanner';

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  },
}));

describe('ClaimStatusBanner', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
  };

  const mockPendingClaim = {
    id: 'claim-1',
    status: 'pending' as const,
    agency: {
      name: 'Test Staffing Agency',
      slug: 'test-staffing-agency',
    },
  };

  const mockApprovedClaim = {
    id: 'claim-2',
    status: 'approved' as const,
    agency: {
      name: 'Approved Agency',
      slug: 'approved-agency',
    },
  };

  const mockRejectedClaim = {
    id: 'claim-3',
    status: 'rejected' as const,
    agency: {
      name: 'Rejected Agency',
      slug: 'rejected-agency',
    },
  };

  const mockUnderReviewClaim = {
    id: 'claim-4',
    status: 'under_review' as const,
    agency: {
      name: 'Under Review Agency',
      slug: 'under-review-agency',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering Conditions', () => {
    it('should not render when user is null', async () => {
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

      const { container } = render(<ClaimStatusBanner />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not render when user has no claims', async () => {
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

      const { container } = render(<ClaimStatusBanner />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should not render for rejected claims', async () => {
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

      const { container } = render(<ClaimStatusBanner />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should not render for under_review claims', async () => {
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

      const { container } = render(<ClaimStatusBanner />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should not render during loading', () => {
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

      const { container } = render(<ClaimStatusBanner />);

      // Should not render while loading
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Pending Claim Banner', () => {
    it('should render pending claim banner with correct text', async () => {
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
        json: async () => ({ data: [mockPendingClaim] }),
      });

      render(<ClaimStatusBanner />);

      await waitFor(() => {
        expect(
          screen.getByText(/Claim request pending review for/i)
        ).toBeInTheDocument();
        expect(screen.getByText('Test Staffing Agency')).toBeInTheDocument();
      });
    });

    it('should include "View Status" link to settings for pending claim', async () => {
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
        json: async () => ({ data: [mockPendingClaim] }),
      });

      render(<ClaimStatusBanner />);

      await waitFor(() => {
        const link = screen.getByText('View Status');
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute('href', '/settings');
      });
    });

    it('should have yellow/warning styling for pending claim', async () => {
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
        json: async () => ({ data: [mockPendingClaim] }),
      });

      render(<ClaimStatusBanner />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.className).toContain('border-yellow-200');
        expect(alert.className).toContain('bg-yellow-50');
      });
    });
  });

  describe('Approved Claim Banner', () => {
    it('should render approved claim banner with correct text', async () => {
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
        json: async () => ({ data: [mockApprovedClaim] }),
      });

      render(<ClaimStatusBanner />);

      await waitFor(() => {
        expect(screen.getByText(/was approved!/i)).toBeInTheDocument();
        expect(screen.getByText('Approved Agency')).toBeInTheDocument();
      });
    });

    it('should include "Manage your profile" link for approved claim', async () => {
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
        json: async () => ({ data: [mockApprovedClaim] }),
      });

      render(<ClaimStatusBanner />);

      await waitFor(() => {
        const link = screen.getByText('Manage your profile');
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute(
          'href',
          '/dashboard/agency/approved-agency'
        );
      });
    });

    it('should have green/success styling for approved claim', async () => {
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
        json: async () => ({ data: [mockApprovedClaim] }),
      });

      render(<ClaimStatusBanner />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.className).toContain('border-green-200');
        expect(alert.className).toContain('bg-green-50');
      });
    });

    it('should prioritize approved over pending when both exist', async () => {
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
        json: async () => ({
          data: [mockPendingClaim, mockApprovedClaim],
        }),
      });

      render(<ClaimStatusBanner />);

      await waitFor(() => {
        expect(screen.getByText(/was approved!/i)).toBeInTheDocument();
        expect(screen.queryByText(/pending review/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Dismissal Functionality', () => {
    it('should have dismiss button', async () => {
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
        json: async () => ({ data: [mockPendingClaim] }),
      });

      render(<ClaimStatusBanner />);

      await waitFor(() => {
        const dismissButton = screen.getByLabelText('Dismiss notification');
        expect(dismissButton).toBeInTheDocument();
      });
    });

    it('should hide banner when dismissed', async () => {
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
        json: async () => ({ data: [mockPendingClaim] }),
      });

      const { container } = render(<ClaimStatusBanner />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should store dismissal in localStorage', async () => {
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
        json: async () => ({ data: [mockPendingClaim] }),
      });

      render(<ClaimStatusBanner />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(localStorage.getItem('claim-banner-dismissed-claim-1')).toBe(
          'true'
        );
      });
    });

    it('should not render if previously dismissed', async () => {
      localStorage.setItem('claim-banner-dismissed-claim-1', 'true');

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
        json: async () => ({ data: [mockPendingClaim] }),
      });

      const { container } = render(<ClaimStatusBanner />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should render different claim if previous was dismissed', async () => {
      localStorage.setItem('claim-banner-dismissed-claim-1', 'true');

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
        json: async () => ({ data: [mockPendingClaim, mockApprovedClaim] }),
      });

      render(<ClaimStatusBanner />);

      await waitFor(() => {
        // Should show approved claim since pending was dismissed
        expect(screen.getByText(/was approved!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should fail silently when API call fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

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

      const { container } = render(<ClaimStatusBanner />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching claims for banner:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should fail silently when API returns non-ok response', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

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

      const { container } = render(<ClaimStatusBanner />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', async () => {
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
        json: async () => ({ data: [mockPendingClaim] }),
      });

      render(<ClaimStatusBanner />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveAttribute('aria-live', 'polite');
        expect(alert).toHaveAttribute('aria-atomic', 'true');
      });
    });

    it('should have accessible dismiss button label', async () => {
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
        json: async () => ({ data: [mockPendingClaim] }),
      });

      render(<ClaimStatusBanner />);

      await waitFor(() => {
        const dismissButton = screen.getByLabelText('Dismiss notification');
        expect(dismissButton).toBeInTheDocument();
      });
    });
  });
});
