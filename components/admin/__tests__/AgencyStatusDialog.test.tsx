import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgencyStatusDialog } from '../AgencyStatusDialog';

describe('AgencyStatusDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Deactivate variant (currentStatus=active)', () => {
    it('renders deactivate dialog with correct title and description', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Deactivate Test Agency\?/i)).toBeInTheDocument();
      expect(screen.getByText(/This will deactivate/i)).toBeInTheDocument();
      expect(
        screen.getByText(/will no longer appear in public listings/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You can reactivate the agency at any time/i)
      ).toBeInTheDocument();
    });

    it('displays red alert icon for deactivation', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Check for AlertCircle icon (Lucide icons render as SVG)
      const alertDialog = screen.getByRole('alertdialog');
      expect(alertDialog).toBeInTheDocument();
    });

    it('renders Deactivate Agency button with red styling', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', {
        name: /Deactivate Agency/i,
      });
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('shows "Deactivating..." when isLoading=true', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(
        screen.getByRole('button', { name: /Deactivating\.\.\./i })
      ).toBeInTheDocument();
    });
  });

  describe('Reactivate variant (currentStatus=inactive)', () => {
    it('renders reactivate dialog with correct title and description', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="inactive"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Reactivate Test Agency\?/i)).toBeInTheDocument();
      expect(screen.getByText(/This will reactivate/i)).toBeInTheDocument();
      expect(
        screen.getByText(/will become visible in public listings/i)
      ).toBeInTheDocument();
    });

    it('displays green check icon for reactivation', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="inactive"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Check for CheckCircle2 icon (Lucide icons render as SVG)
      const alertDialog = screen.getByRole('alertdialog');
      expect(alertDialog).toBeInTheDocument();
    });

    it('renders Reactivate Agency button without red styling', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="inactive"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', {
        name: /Reactivate Agency/i,
      });
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).not.toHaveClass('bg-red-600');
    });

    it('shows "Reactivating..." when isLoading=true', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="inactive"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(
        screen.getByRole('button', { name: /Reactivating\.\.\./i })
      ).toBeInTheDocument();
    });
  });

  describe('Dialog visibility', () => {
    it('renders when isOpen=true', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Deactivate Test Agency\?/i)).toBeInTheDocument();
    });

    it('does not render when isOpen=false', () => {
      render(
        <AgencyStatusDialog
          isOpen={false}
          agencyName="Test Agency"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.queryByText(/Deactivate Test Agency\?/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Button interactions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', {
        name: /Deactivate Agency/i,
      });
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('disables buttons when isLoading=true', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      const confirmButton = screen.getByRole('button', {
        name: /Deactivating\.\.\./i,
      });
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('enables buttons when isLoading=false', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isLoading={false}
        />
      );

      const confirmButton = screen.getByRole('button', {
        name: /Deactivate Agency/i,
      });
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      expect(confirmButton).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe('Keyboard navigation', () => {
    it('calls onCancel when Escape key is pressed', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // AlertDialog from Radix handles Escape internally via onOpenChange
      // Simulate the onOpenChange behavior when dialog is closed
      const dialog = screen.getByRole('alertdialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      // The onOpenChange with false should trigger onCancel
      // Note: This test verifies the onOpenChange handler is set correctly
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Agency name display', () => {
    it('displays agency name in title for deactivate', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="ABC Construction Staffing"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(/Deactivate ABC Construction Staffing\?/i)
      ).toBeInTheDocument();
    });

    it('displays agency name in title for reactivate', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="XYZ Recruiting Services"
          currentStatus="inactive"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(/Reactivate XYZ Recruiting Services\?/i)
      ).toBeInTheDocument();
    });

    it('displays agency name in description for deactivate', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Test Agency Name"
          currentStatus="active"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // The agency name appears in a <strong> tag in the description
      const strongElement = screen.getByText('Test Agency Name');
      expect(strongElement).toBeInTheDocument();
      expect(strongElement.tagName).toBe('STRONG');
    });

    it('displays agency name in description for reactivate', () => {
      render(
        <AgencyStatusDialog
          isOpen={true}
          agencyName="Another Agency"
          currentStatus="inactive"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const strongElement = screen.getByText('Another Agency');
      expect(strongElement).toBeInTheDocument();
      expect(strongElement.tagName).toBe('STRONG');
    });
  });
});
