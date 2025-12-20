/**
 * Tests for ClaimRejectionDialog Component
 *
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClaimRejectionDialog } from '../ClaimRejectionDialog';

describe('ClaimRejectionDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  const mockAgencyName = 'ACME Staffing Solutions';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(`Reject Claim for ${mockAgencyName}`)
      ).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <ClaimRejectionDialog
          isOpen={false}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.queryByText(`Reject Claim for ${mockAgencyName}`)
      ).not.toBeInTheDocument();
    });

    it('should display agency name in title', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(`Reject Claim for ${mockAgencyName}`)
      ).toBeInTheDocument();
    });

    it('should display textarea for rejection reason', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      expect(textarea).toBeInTheDocument();
    });

    it('should display professional guidance alert', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(/The rejection reason should be professional/)
      ).toBeInTheDocument();
    });

    it('should display explanation about email notification', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(/The requester will receive this reason via email/)
      ).toBeInTheDocument();
    });
  });

  describe('Character Counter', () => {
    it('should show 0 / 20 characters initially', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/0 \/ 20 characters/)).toBeInTheDocument();
    });

    it('should update character count when user types', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      fireEvent.change(textarea, { target: { value: 'Test reason' } });

      expect(screen.getByText(/11 \/ 20 characters/)).toBeInTheDocument();
    });

    it('should show how many more characters are required', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      fireEvent.change(textarea, { target: { value: 'Short' } });

      expect(screen.getByText(/\(15 more required\)/)).toBeInTheDocument();
    });

    it('should not show "more required" when minimum length is met', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      fireEvent.change(textarea, {
        target: { value: 'This is a valid reason that is long enough' },
      });

      expect(screen.queryByText(/more required/)).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should disable Reject Claim button when reason is empty', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const rejectButton = screen.getByText('Reject Claim');
      expect(rejectButton).toBeDisabled();
    });

    it('should disable Reject Claim button when reason is less than 20 characters', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      fireEvent.change(textarea, { target: { value: 'Too short' } });

      const rejectButton = screen.getByText('Reject Claim');
      expect(rejectButton).toBeDisabled();
    });

    it('should enable Reject Claim button when reason is 20 characters or more', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      fireEvent.change(textarea, {
        target: { value: 'This is exactly 20 characters long enough.' },
      });

      const rejectButton = screen.getByText('Reject Claim');
      expect(rejectButton).not.toBeDisabled();
    });

    it('should not call onConfirm when button is disabled with invalid reason', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      fireEvent.change(textarea, { target: { value: 'Short' } });

      const rejectButton = screen.getByText('Reject Claim');

      // Button should be disabled
      expect(rejectButton).toBeDisabled();

      // Clicking disabled button should not call onConfirm
      fireEvent.click(rejectButton);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should trim whitespace before validating', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      fireEvent.change(textarea, {
        target: { value: '   Too short   ' },
      });

      const rejectButton = screen.getByText('Reject Claim');
      expect(rejectButton).toBeDisabled();
    });

    it('should enable button when user types enough characters', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      const rejectButton = screen.getByText('Reject Claim');

      // Start with short text - button disabled
      fireEvent.change(textarea, { target: { value: 'Short' } });
      expect(rejectButton).toBeDisabled();

      // Type more to meet minimum length - button enabled
      fireEvent.change(textarea, {
        target: { value: 'This is now a valid rejection reason' },
      });
      expect(rejectButton).not.toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm with trimmed reason when valid submission', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      fireEvent.change(textarea, {
        target: {
          value: '   This is a valid rejection reason with extra spaces   ',
        },
      });

      fireEvent.click(screen.getByText('Reject Claim'));

      expect(mockOnConfirm).toHaveBeenCalledWith(
        'This is a valid rejection reason with extra spaces'
      );
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when Cancel button is clicked', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('State Reset', () => {
    it('should reset reason when dialog is closed and reopened', async () => {
      const { rerender } = render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      fireEvent.change(textarea, {
        target: { value: 'This is a valid rejection reason' },
      });

      expect(textarea).toHaveValue('This is a valid rejection reason');

      // Close dialog
      rerender(
        <ClaimRejectionDialog
          isOpen={false}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Reopen dialog
      rerender(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const newTextarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      expect(newTextarea).toHaveValue('');
    });

    it('should reset button state when dialog is closed and reopened', async () => {
      const { rerender } = render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );

      // Enter short text - button should be disabled
      fireEvent.change(textarea, { target: { value: 'Short' } });
      let rejectButton = screen.getByText('Reject Claim');
      expect(rejectButton).toBeDisabled();

      // Close dialog
      rerender(
        <ClaimRejectionDialog
          isOpen={false}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Reopen dialog
      rerender(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Button should be disabled again (empty state)
      rejectButton = screen.getByText('Reject Claim');
      expect(rejectButton).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('should show "Rejecting..." text when isLoading is true', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(screen.getByText('Rejecting...')).toBeInTheDocument();
      expect(screen.queryByText('Reject Claim')).not.toBeInTheDocument();
    });

    it('should disable textarea when isLoading is true', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      const textarea = screen.getByPlaceholderText(
        /Explain why this claim is being rejected/
      );
      expect(textarea).toBeDisabled();
    });

    it('should disable Cancel button when isLoading is true', () => {
      render(
        <ClaimRejectionDialog
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

    it('should not disable buttons when isLoading is false', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={false}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe('Default Props', () => {
    it('should default isLoading to false when not provided', () => {
      render(
        <ClaimRejectionDialog
          isOpen={true}
          agencyName={mockAgencyName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Reject Claim')).toBeInTheDocument();
      expect(screen.queryByText('Rejecting...')).not.toBeInTheDocument();
    });
  });
});
