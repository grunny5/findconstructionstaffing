/**
 * Tests for ClaimDetailModal Component
 *
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClaimDetailModal } from '../ClaimDetailModal';
import type { ClaimRequest } from '@/types/api';
import type { ClaimStatus } from '@/types/database';
import { toast } from 'sonner';

// Mock global fetch
global.fetch = jest.fn();

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the ClaimVerificationChecklist component
jest.mock('../ClaimVerificationChecklist', () => ({
  ClaimVerificationChecklist: ({
    emailDomainVerified,
    phoneProvided,
    positionProvided,
    verificationMethod,
  }: {
    emailDomainVerified: boolean;
    phoneProvided: boolean;
    positionProvided: boolean;
    verificationMethod: string;
  }) => (
    <div data-testid="verification-checklist">
      <div>Email Verified: {emailDomainVerified ? 'Yes' : 'No'}</div>
      <div>Phone Provided: {phoneProvided ? 'Yes' : 'No'}</div>
      <div>Position Provided: {positionProvided ? 'Yes' : 'No'}</div>
      <div>Method: {verificationMethod}</div>
    </div>
  ),
}));

// Mock the new confirmation dialog components
jest.mock('../ClaimApprovalConfirmation', () => ({
  ClaimApprovalConfirmation: ({
    isOpen,
    agencyName,
    onConfirm,
    onCancel,
    isLoading,
  }: {
    isOpen: boolean;
    agencyName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
  }) =>
    isOpen ? (
      <div data-testid="approval-confirmation">
        <div>Agency: {agencyName}</div>
        <button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Approving...' : 'Confirm Approval'}
        </button>
        <button onClick={onCancel} disabled={isLoading}>
          Cancel Approval
        </button>
      </div>
    ) : null,
}));

jest.mock('../ClaimRejectionDialog', () => ({
  ClaimRejectionDialog: ({
    isOpen,
    agencyName,
    onConfirm,
    onCancel,
    isLoading,
  }: {
    isOpen: boolean;
    agencyName: string;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
  }) =>
    isOpen ? (
      <div data-testid="rejection-dialog">
        <div>Agency: {agencyName}</div>
        <button
          onClick={() => onConfirm('Test rejection reason')}
          disabled={isLoading}
        >
          {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
        </button>
        <button onClick={onCancel} disabled={isLoading}>
          Cancel Rejection
        </button>
      </div>
    ) : null,
}));

const mockClaim: ClaimRequest = {
  id: 'claim-123',
  agency_id: 'agency-1',
  user_id: 'user-1',
  status: 'pending' as ClaimStatus,
  business_email: 'john@acmestaffing.com',
  phone_number: '+1-555-0123',
  position_title: 'HR Manager',
  verification_method: 'email',
  email_domain_verified: true,
  additional_notes: 'Please expedite review.',
  rejection_reason: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  agency: {
    id: 'agency-1',
    name: 'ACME Staffing Solutions',
    slug: 'acme-staffing',
    logo_url: 'https://example.com/logo.png',
    website: 'https://acmestaffing.com',
  },
  user: {
    id: 'user-1',
    full_name: 'John Doe',
    email: 'john.doe@example.com',
  },
};

describe('ClaimDetailModal', () => {
  const mockOnClose = jest.fn();
  const mockOnApprove = jest.fn();
  const mockOnReject = jest.fn();
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Modal Visibility', () => {
    it('should not render when claim is null', () => {
      const { container } = render(
        <ClaimDetailModal
          isOpen={true}
          claim={null}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true and claim is provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('Claim Request Review')).toBeInTheDocument();
    });
  });

  describe('Agency Information Section', () => {
    it('should display agency name', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('ACME Staffing Solutions')).toBeInTheDocument();
    });

    it('should display agency logo when logo_url is provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      const logo = screen.getByAltText('ACME Staffing Solutions logo');
      expect(logo).toBeInTheDocument();
      // Next.js Image component transforms the src with optimization params
      expect(logo).toHaveAttribute('src');
      expect(logo.getAttribute('src')).toContain('example.com');
    });

    it('should not render logo when logo_url is null', () => {
      const claimWithoutLogo = {
        ...mockClaim,
        agency: { ...mockClaim.agency, logo_url: null },
      };

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={claimWithoutLogo}
          onClose={mockOnClose}
        />
      );

      const logo = screen.queryByAltText('ACME Staffing Solutions logo');
      expect(logo).not.toBeInTheDocument();
    });

    it('should display agency website link when provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      const websiteLink = screen.getAllByText('https://acmestaffing.com')[0];
      expect(websiteLink).toBeInTheDocument();
      expect(websiteLink.closest('a')).toHaveAttribute(
        'href',
        'https://acmestaffing.com'
      );
    });
  });

  describe('Requester Information Section', () => {
    it('should display business email', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('john@acmestaffing.com')).toBeInTheDocument();
    });

    it('should show domain verified indicator when email_domain_verified is true', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Domain Verified')).toBeInTheDocument();
    });

    it('should show domain not verified indicator when email_domain_verified is false', () => {
      const claimWithUnverifiedEmail = {
        ...mockClaim,
        email_domain_verified: false,
      };

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={claimWithUnverifiedEmail}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Domain Not Verified')).toBeInTheDocument();
    });

    it('should display phone number when provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
    });

    it('should not display phone section when phone_number is null', () => {
      const claimWithoutPhone = {
        ...mockClaim,
        phone_number: null,
      };

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={claimWithoutPhone}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('+1-555-0123')).not.toBeInTheDocument();
    });

    it('should display position title', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('HR Manager')).toBeInTheDocument();
    });

    it('should display user full name when provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should not display user full name section when null', () => {
      const claimWithoutUserName = {
        ...mockClaim,
        user: { ...mockClaim.user, full_name: null },
      };

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={claimWithoutUserName}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('User Account Name')).not.toBeInTheDocument();
    });

    it('should display user account email', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });
  });

  describe('Verification Checklist Section', () => {
    it('should render ClaimVerificationChecklist component', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('verification-checklist')).toBeInTheDocument();
    });

    it('should pass correct props to ClaimVerificationChecklist', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      const checklist = screen.getByTestId('verification-checklist');
      expect(checklist).toHaveTextContent('Email Verified: Yes');
      expect(checklist).toHaveTextContent('Phone Provided: Yes');
      expect(checklist).toHaveTextContent('Position Provided: Yes');
      expect(checklist).toHaveTextContent('Method: email');
    });
  });

  describe('Additional Notes Section', () => {
    it('should display additional notes when provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Please expedite review.')).toBeInTheDocument();
    });

    it('should not render additional notes section when notes are null', () => {
      const claimWithoutNotes = {
        ...mockClaim,
        additional_notes: null,
      };

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={claimWithoutNotes}
          onClose={mockOnClose}
        />
      );

      expect(
        screen.queryByText('Please expedite review.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Rejection Reason Section', () => {
    it('should display rejection reason when status is rejected and reason is provided', () => {
      const rejectedClaim = {
        ...mockClaim,
        status: 'rejected' as ClaimStatus,
        rejection_reason: 'Email domain does not match agency website.',
      };

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={rejectedClaim}
          onClose={mockOnClose}
        />
      );

      expect(
        screen.getByText('Email domain does not match agency website.')
      ).toBeInTheDocument();
    });

    it('should not render rejection section when status is not rejected', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Rejection Reason')).not.toBeInTheDocument();
    });
  });

  describe('External Verification Links Section', () => {
    it('should display link to agency website when provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      const websiteButton = screen.getByText('Visit Agency Website');
      expect(websiteButton.closest('a')).toHaveAttribute(
        'href',
        'https://acmestaffing.com'
      );
    });

    it('should not display website link when website is null', () => {
      const claimWithoutWebsite = {
        ...mockClaim,
        agency: { ...mockClaim.agency, website: null },
      };

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={claimWithoutWebsite}
          onClose={mockOnClose}
        />
      );

      expect(
        screen.queryByText('Visit Agency Website')
      ).not.toBeInTheDocument();
    });

    it('should display Google search link for agency', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      const googleButton = screen.getByText(/Google "ACME Staffing Solutions"/);
      expect(googleButton.closest('a')).toHaveAttribute(
        'href',
        'https://www.google.com/search?q=ACME%20Staffing%20Solutions'
      );
    });
  });

  describe('Metadata Section', () => {
    it('should display formatted submitted date', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
      expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
    });

    it('should display claim ID', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Claim ID: claim-123/)).toBeInTheDocument();
    });
  });

  describe('Status Badge', () => {
    it('should display pending status badge', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display approved status badge', () => {
      const approvedClaim = {
        ...mockClaim,
        status: 'approved' as ClaimStatus,
      };

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={approvedClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('should display rejected status badge', () => {
      const rejectedClaim = {
        ...mockClaim,
        status: 'rejected' as ClaimStatus,
      };

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={rejectedClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('should display under review status badge', () => {
      const underReviewClaim = {
        ...mockClaim,
        status: 'under_review' as ClaimStatus,
      };

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={underReviewClaim}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Under Review')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should always display Close button', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      const closeButtons = screen.getAllByText('Close');
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('should call onClose when Close button is clicked', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      // Get all Close buttons and click the one in DialogFooter (first one)
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      fireEvent.click(closeButtons[0]);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should display Approve and Reject buttons when status is pending', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('Approve')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    it('should not display Approve and Reject buttons when status is approved', () => {
      const approvedClaim = {
        ...mockClaim,
        status: 'approved' as ClaimStatus,
      };

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={approvedClaim}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.queryByText('Approve')).not.toBeInTheDocument();
      expect(screen.queryByText('Reject')).not.toBeInTheDocument();
    });

    it('should call onApprove with claim ID when Approve button is clicked', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      fireEvent.click(screen.getByText('Approve'));
      expect(mockOnApprove).toHaveBeenCalledWith('claim-123');
      expect(mockOnApprove).toHaveBeenCalledTimes(1);
    });

    it('should call onReject with claim ID when Reject button is clicked', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      fireEvent.click(screen.getByText('Reject'));
      expect(mockOnReject).toHaveBeenCalledWith('claim-123');
      expect(mockOnReject).toHaveBeenCalledTimes(1);
    });

    it('should not disable Approve button when onApprove is not provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
          onReject={mockOnReject}
        />
      );

      const approveButton = screen.getByText('Approve');
      expect(approveButton).not.toBeDisabled();
    });

    it('should not disable Reject button when onReject is not provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
        />
      );

      const rejectButton = screen.getByText('Reject');
      expect(rejectButton).not.toBeDisabled();
    });
  });

  describe('Approval Confirmation Dialog', () => {
    it('should open approval confirmation when Approve is clicked without onApprove callback', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Approve'));

      expect(screen.getByTestId('approval-confirmation')).toBeInTheDocument();
      expect(
        screen.getByText('Agency: ACME Staffing Solutions')
      ).toBeInTheDocument();
    });

    it('should not open approval confirmation when onApprove callback is provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
        />
      );

      fireEvent.click(screen.getByText('Approve'));

      expect(mockOnApprove).toHaveBeenCalledWith('claim-123');
      expect(
        screen.queryByTestId('approval-confirmation')
      ).not.toBeInTheDocument();
    });

    it('should close approval confirmation when Cancel Approval is clicked', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Approve'));
      expect(screen.getByTestId('approval-confirmation')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel Approval'));
      expect(
        screen.queryByTestId('approval-confirmation')
      ).not.toBeInTheDocument();
    });

    it('should call approve API and show success toast on confirmation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
          onRefresh={mockOnRefresh}
        />
      );

      fireEvent.click(screen.getByText('Approve'));
      fireEvent.click(screen.getByText('Confirm Approval'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/claims/claim-123/approve',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Claim Approved', {
          description:
            'ACME Staffing Solutions claim has been approved. User role updated to agency_owner.',
        });
      });

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('should show error toast when approve API fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Failed to approve claim' } }),
      });

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Approve'));
      fireEvent.click(screen.getByText('Confirm Approval'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Approval Failed', {
          description: 'Failed to approve claim',
        });
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should disable buttons during approval processing', async () => {
      let resolveApproval: (value: any) => void;
      const approvalPromise = new Promise((resolve) => {
        resolveApproval = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(approvalPromise);

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Approve'));
      fireEvent.click(screen.getByText('Confirm Approval'));

      await waitFor(() => {
        expect(screen.getByText('Approving...')).toBeInTheDocument();
        expect(screen.getByText('Approving...')).toBeDisabled();
      });

      resolveApproval!({
        ok: true,
        json: async () => ({ success: true }),
      });
    });
  });

  describe('Rejection Dialog', () => {
    it('should open rejection dialog when Reject is clicked without onReject callback', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Reject'));

      expect(screen.getByTestId('rejection-dialog')).toBeInTheDocument();
      expect(
        screen.getByText('Agency: ACME Staffing Solutions')
      ).toBeInTheDocument();
    });

    it('should not open rejection dialog when onReject callback is provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
          onReject={mockOnReject}
        />
      );

      fireEvent.click(screen.getByText('Reject'));

      expect(mockOnReject).toHaveBeenCalledWith('claim-123');
      expect(screen.queryByTestId('rejection-dialog')).not.toBeInTheDocument();
    });

    it('should close rejection dialog when Cancel Rejection is clicked', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Reject'));
      expect(screen.getByTestId('rejection-dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel Rejection'));
      expect(screen.queryByTestId('rejection-dialog')).not.toBeInTheDocument();
    });

    it('should call reject API with reason and show success toast on confirmation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
          onRefresh={mockOnRefresh}
        />
      );

      fireEvent.click(screen.getByText('Reject'));
      fireEvent.click(screen.getByText('Confirm Rejection'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/claims/claim-123/reject',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rejection_reason: 'Test rejection reason' }),
          }
        );
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Claim Rejected', {
          description:
            'ACME Staffing Solutions claim has been rejected. Requester will be notified.',
        });
      });

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('should show error toast when reject API fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Failed to reject claim' } }),
      });

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Reject'));
      fireEvent.click(screen.getByText('Confirm Rejection'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Rejection Failed', {
          description: 'Failed to reject claim',
        });
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should disable buttons during rejection processing', async () => {
      let resolveRejection: (value: any) => void;
      const rejectionPromise = new Promise((resolve) => {
        resolveRejection = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(rejectionPromise);

      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Reject'));
      fireEvent.click(screen.getByText('Confirm Rejection'));

      await waitFor(() => {
        expect(screen.getByText('Rejecting...')).toBeInTheDocument();
        expect(screen.getByText('Rejecting...')).toBeDisabled();
      });

      resolveRejection!({
        ok: true,
        json: async () => ({ success: true }),
      });
    });
  });
});
