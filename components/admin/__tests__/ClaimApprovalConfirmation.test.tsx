/**
 * Tests for ClaimApprovalConfirmation Component
 *
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ClaimApprovalConfirmation } from '../ClaimApprovalConfirmation';

describe('ClaimApprovalConfirmation', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  const mockAgencyName = 'ACME Staffing Solutions';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(`Approve Claim for ${mockAgencyName}?`)
      ).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={false}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.queryByText(`Approve Claim for ${mockAgencyName}?`)
      ).not.toBeInTheDocument();
    });

    it('should display agency name in title', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(`Approve Claim for ${mockAgencyName}?`)
      ).toBeInTheDocument();
    });

    it('should display all three consequences of approval', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/agency_owner/)).toBeInTheDocument();
      expect(
        screen.getByText(/edit agency information, services, and settings/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/approval notification will be sent to their email/)
      ).toBeInTheDocument();
    });

    it('should display warning about irreversibility', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(/This action cannot be easily reversed/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/ensure you have verified the requester/)
      ).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when Approve Claim button is clicked', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('Approve Claim'));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      // Note: AlertDialog may also call onCancel when the dialog auto-closes
    });

    it('should call onCancel when Cancel button is clicked', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show "Approving..." text when isLoading is true', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(screen.getByText('Approving...')).toBeInTheDocument();
      expect(screen.queryByText('Approve Claim')).not.toBeInTheDocument();
    });

    it('should show "Approve Claim" text when isLoading is false', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={false}
        />
      );

      expect(screen.getByText('Approve Claim')).toBeInTheDocument();
      expect(screen.queryByText('Approving...')).not.toBeInTheDocument();
    });

    it('should disable Cancel button when isLoading is true', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });

    it('should disable Approve Claim button when isLoading is true', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      const approveButton = screen.getByText('Approving...');
      expect(approveButton).toBeDisabled();
    });

    it('should not disable buttons when isLoading is false', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={false}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      const approveButton = screen.getByText('Approve Claim');

      expect(cancelButton).not.toBeDisabled();
      expect(approveButton).not.toBeDisabled();
    });
  });

  describe('Default Props', () => {
    it('should default isLoading to false when not provided', () => {
      render(
        <ClaimApprovalConfirmation
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Approve Claim')).toBeInTheDocument();
      expect(screen.queryByText('Approving...')).not.toBeInTheDocument();
    });
  });
});
