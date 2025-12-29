/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import NotificationsSettingsPage from '../page';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock global fetch
global.fetch = jest.fn();

describe('NotificationsSettingsPage', () => {
  const mockPreferences = {
    email_enabled: true,
    email_batch_enabled: true,
    email_daily_digest_enabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  describe('Loading State', () => {
    it('should show loading spinner while fetching preferences', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolve
      );

      const { container } = render(<NotificationsSettingsPage />);

      // Check for the loading spinner by class name
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // FETCHING PREFERENCES
  // ===========================================================================

  describe('Fetching Preferences', () => {
    it('should fetch and display existing preferences on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPreferences }),
      });

      render(<NotificationsSettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Notification Preferences')
        ).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/settings/notification-preferences'
      );

      // Verify switches are set correctly
      const emailSwitch = screen.getByRole('switch', {
        name: /email notifications/i,
      });
      const batchSwitch = screen.getByRole('switch', {
        name: /batch notifications/i,
      });
      const digestSwitch = screen.getByRole('switch', {
        name: /daily digest/i,
      });

      expect(emailSwitch).toBeChecked();
      expect(batchSwitch).toBeChecked();
      expect(digestSwitch).not.toBeChecked();
    });

    it('should show error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Mock console.error to suppress error output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<NotificationsSettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load notification preferences/i)
        ).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  // ===========================================================================
  // TOGGLING PREFERENCES
  // ===========================================================================

  describe('Toggling Preferences', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPreferences }),
      });

      render(<NotificationsSettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Notification Preferences')
        ).toBeInTheDocument();
      });

      // Clear the initial fetch call
      (global.fetch as jest.Mock).mockClear();
    });

    it('should disable batch and digest when email is disabled', async () => {
      const user = userEvent.setup();

      const emailSwitch = screen.getByRole('switch', {
        name: /email notifications/i,
      });
      const batchSwitch = screen.getByRole('switch', {
        name: /batch notifications/i,
      });
      const digestSwitch = screen.getByRole('switch', {
        name: /daily digest/i,
      });

      await user.click(emailSwitch);

      // Batch and digest should be disabled
      expect(batchSwitch).toBeDisabled();
      expect(batchSwitch).not.toBeChecked();
      expect(digestSwitch).toBeDisabled();
      expect(digestSwitch).not.toBeChecked();
    });

    it('should disable digest when batch is enabled', async () => {
      // Start with batch disabled
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            email_enabled: true,
            email_batch_enabled: false,
            email_daily_digest_enabled: false,
          },
        }),
      });

      const { rerender } = render(<NotificationsSettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Notification Preferences')
        ).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const batchSwitch = screen.getByRole('switch', {
        name: /batch notifications/i,
      });

      await user.click(batchSwitch);

      // Digest should remain unchecked
      const digestSwitch = screen.getByRole('switch', {
        name: /daily digest/i,
      });
      expect(digestSwitch).not.toBeChecked();
    });

    it('should disable batch when digest is enabled', async () => {
      const user = userEvent.setup();
      const digestSwitch = screen.getByRole('switch', {
        name: /daily digest/i,
      });

      await user.click(digestSwitch);

      // Batch should be disabled
      const batchSwitch = screen.getByRole('switch', {
        name: /batch notifications/i,
      });
      expect(batchSwitch).not.toBeChecked();
    });
  });

  // ===========================================================================
  // SAVING PREFERENCES
  // ===========================================================================

  describe('Saving Preferences', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPreferences }),
      });

      render(<NotificationsSettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Notification Preferences')
        ).toBeInTheDocument();
      });

      // Clear the initial fetch call
      (global.fetch as jest.Mock).mockClear();
    });

    it('should save preferences successfully', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPreferences }),
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/settings/notification-preferences',
          expect.objectContaining({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(mockPreferences),
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith(
        'Notification preferences updated'
      );
    });

    it('should show error toast when save fails', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Mock console.error to suppress error output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to save notification preferences'
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should show saving state while request is in progress', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ data: mockPreferences }),
                }),
              100
            );
          })
      );

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Button should show "Saving..." and be disabled
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Notification preferences updated'
        );
      });
    });
  });

  // ===========================================================================
  // UI RENDERING
  // ===========================================================================

  describe('UI Rendering', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPreferences }),
      });

      render(<NotificationsSettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Notification Preferences')
        ).toBeInTheDocument();
      });
    });

    it('should render all preference toggles', () => {
      expect(screen.getByText('Email notifications')).toBeInTheDocument();
      expect(screen.getByText('Batch notifications')).toBeInTheDocument();
      expect(screen.getByText('Daily digest')).toBeInTheDocument();
    });

    it('should render description text', () => {
      expect(
        screen.getByText(
          'Manage how you receive notifications about new messages'
        )
      ).toBeInTheDocument();
    });

    it('should render save button', () => {
      expect(
        screen.getByRole('button', { name: /save changes/i })
      ).toBeInTheDocument();
    });

    it('should render help text about mutual exclusivity', () => {
      expect(
        screen.getByText(
          /batch notifications and daily digest are mutually exclusive/i
        )
      ).toBeInTheDocument();
    });
  });
});
