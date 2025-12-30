import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgencyStatusToggle } from '../AgencyStatusToggle';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock use-toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AgencyStatusToggle', () => {
  const mockRouter = {
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  };

  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Button rendering', () => {
    it('renders Deactivate button when agency is active', () => {
      render(
        <AgencyStatusToggle
          agencyId="agency-123"
          agencyName="Test Agency"
          currentStatus="active"
        />
      );

      const button = screen.getByRole('button', { name: /Deactivate/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-destructive');
    });

    it('renders Reactivate button when agency is inactive', () => {
      render(
        <AgencyStatusToggle
          agencyId="agency-123"
          agencyName="Test Agency"
          currentStatus="inactive"
        />
      );

      const button = screen.getByRole('button', { name: /Reactivate/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveClass('bg-destructive');
    });
  });

  describe('Dialog interaction', () => {
    it('opens dialog when Deactivate button is clicked', () => {
      render(
        <AgencyStatusToggle
          agencyId="agency-123"
          agencyName="Test Agency"
          currentStatus="active"
        />
      );

      const button = screen.getByRole('button', { name: /Deactivate/i });
      fireEvent.click(button);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/Deactivate Test Agency\?/i)).toBeInTheDocument();
    });

    it('opens dialog when Reactivate button is clicked', () => {
      render(
        <AgencyStatusToggle
          agencyId="agency-123"
          agencyName="Test Agency"
          currentStatus="inactive"
        />
      );

      const button = screen.getByRole('button', { name: /Reactivate/i });
      fireEvent.click(button);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/Reactivate Test Agency\?/i)).toBeInTheDocument();
    });

    it('closes dialog when cancel button is clicked', async () => {
      render(
        <AgencyStatusToggle
          agencyId="agency-123"
          agencyName="Test Agency"
          currentStatus="active"
        />
      );

      // Open dialog
      const deactivateButton = screen.getByRole('button', {
        name: /Deactivate/i,
      });
      fireEvent.click(deactivateButton);

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Dialog should be closed (not in document)
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('calls API with correct payload when deactivating', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Agency deactivated successfully' }),
      });

      render(
        <AgencyStatusToggle
          agencyId="agency-123"
          agencyName="Test Agency"
          currentStatus="active"
        />
      );

      // Open dialog
      const deactivateButton = screen.getByRole('button', {
        name: /Deactivate/i,
      });
      fireEvent.click(deactivateButton);

      // Confirm action
      const confirmButton = screen.getByRole('button', {
        name: /Deactivate Agency/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/agencies/agency-123/status',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ active: false }),
          }
        );
      });
    });

    it('calls API with correct payload when reactivating', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Agency activated successfully' }),
      });

      render(
        <AgencyStatusToggle
          agencyId="agency-123"
          agencyName="Test Agency"
          currentStatus="inactive"
        />
      );

      // Open dialog
      const reactivateButton = screen.getByRole('button', {
        name: /Reactivate/i,
      });
      fireEvent.click(reactivateButton);

      // Confirm action
      const confirmButton = screen.getByRole('button', {
        name: /Reactivate Agency/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/agencies/agency-123/status',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ active: true }),
          }
        );
      });
    });

    it('shows success toast and refreshes page on successful update', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Agency deactivated successfully' }),
      });

      render(
        <AgencyStatusToggle
          agencyId="agency-123"
          agencyName="Test Agency"
          currentStatus="active"
        />
      );

      // Open dialog and confirm
      fireEvent.click(screen.getByRole('button', { name: /Deactivate/i }));
      fireEvent.click(
        screen.getByRole('button', { name: /Deactivate Agency/i })
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Agency deactivated successfully',
        });
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('shows error toast when API call fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Failed to update agency status' },
        }),
      });

      render(
        <AgencyStatusToggle
          agencyId="agency-123"
          agencyName="Test Agency"
          currentStatus="active"
        />
      );

      // Open dialog and confirm
      fireEvent.click(screen.getByRole('button', { name: /Deactivate/i }));
      fireEvent.click(
        screen.getByRole('button', { name: /Deactivate Agency/i })
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to update agency status',
          variant: 'destructive',
        });
        expect(mockRouter.refresh).not.toHaveBeenCalled();
      });
    });

    it('shows generic error toast when API throws exception', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <AgencyStatusToggle
          agencyId="agency-123"
          agencyName="Test Agency"
          currentStatus="active"
        />
      );

      // Open dialog and confirm
      fireEvent.click(screen.getByRole('button', { name: /Deactivate/i }));
      fireEvent.click(
        screen.getByRole('button', { name: /Deactivate Agency/i })
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Network error',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Dialog closes after successful update', () => {
    it('closes dialog after successful API call', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Agency deactivated successfully' }),
      });

      render(
        <AgencyStatusToggle
          agencyId="agency-123"
          agencyName="Test Agency"
          currentStatus="active"
        />
      );

      // Open dialog and confirm
      fireEvent.click(screen.getByRole('button', { name: /Deactivate/i }));
      fireEvent.click(
        screen.getByRole('button', { name: /Deactivate Agency/i })
      );

      // Dialog should close after successful API call
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });
  });
});
