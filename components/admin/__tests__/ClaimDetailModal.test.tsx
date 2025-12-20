/**
 * Tests for ClaimDetailModal Component
 *
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ClaimDetailModal, type ClaimRequest } from '../ClaimDetailModal';
import type { ClaimStatus } from '@/types/database';

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

  beforeEach(() => {
    jest.clearAllMocks();
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

    it('should disable Approve button when onApprove is not provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
          onReject={mockOnReject}
        />
      );

      const approveButton = screen.getByText('Approve');
      expect(approveButton).toBeDisabled();
    });

    it('should disable Reject button when onReject is not provided', () => {
      render(
        <ClaimDetailModal
          isOpen={true}
          claim={mockClaim}
          onClose={mockOnClose}
          onApprove={mockOnApprove}
        />
      );

      const rejectButton = screen.getByText('Reject');
      expect(rejectButton).toBeDisabled();
    });
  });
});
