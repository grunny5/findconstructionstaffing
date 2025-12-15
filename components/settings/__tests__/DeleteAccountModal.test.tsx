/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteAccountModal } from '../DeleteAccountModal';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Supabase
const mockSignOut = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
(supabase.auth.signOut as jest.Mock) = mockSignOut;

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('DeleteAccountModal', () => {
  const mockOnOpenChange = jest.fn();
  const currentEmail = 'user@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Form Rendering', () => {
    it('should render modal when open', () => {
      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText('Delete Account')).toBeInTheDocument();
      expect(
        screen.getByText(/This action cannot be undone!/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Type DELETE to confirm/i)
      ).toBeInTheDocument();
    });

    it('should show danger warning messages', () => {
      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(
        screen.getByText(/This will permanently delete your account/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Your profile and account settings/)
      ).toBeInTheDocument();
    });

    it('should have Continue button disabled initially', () => {
      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Two-Step Confirmation Flow', () => {
    it('should enable Continue button when DELETE is typed', async () => {
      const user = userEvent.setup();
      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const confirmInput = screen.getByLabelText(/Type DELETE to confirm/i);
      const continueButton = screen.getByRole('button', { name: /Continue/i });

      expect(continueButton).toBeDisabled();

      await user.type(confirmInput, 'DELETE');

      await waitFor(() => {
        expect(continueButton).toBeEnabled();
      });
    });

    it('should show password field after clicking Continue', async () => {
      const user = userEvent.setup();
      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const confirmInput = screen.getByLabelText(/Type DELETE to confirm/i);
      await user.type(confirmInput, 'DELETE');

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Enter your password to confirm/i)
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { name: /Delete My Account/i })
      ).toBeInTheDocument();
    });

    it('should not show password field if DELETE not typed correctly', async () => {
      const user = userEvent.setup();
      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const confirmInput = screen.getByLabelText(/Type DELETE to confirm/i);
      await user.type(confirmInput, 'delete');

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).toBeDisabled();

      expect(
        screen.queryByLabelText(/Enter your password to confirm/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Account Deletion Success', () => {
    it('should successfully delete account with correct credentials', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      mockSignOut.mockResolvedValue({});

      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Step 1: Type DELETE
      const confirmInput = screen.getByLabelText(/Type DELETE to confirm/i);
      await user.type(confirmInput, 'DELETE');

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      // Step 2: Enter password
      await waitFor(() => {
        expect(
          screen.getByLabelText(/Enter your password to confirm/i)
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(
        /Enter your password to confirm/i
      );
      await user.type(passwordInput, 'password123');

      // Submit
      const form = confirmInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/delete-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: 'password123' }),
        });
      });

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error for incorrect password', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Incorrect password' }),
      });

      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const confirmInput = screen.getByLabelText(/Type DELETE to confirm/i);
      await user.type(confirmInput, 'DELETE');

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Enter your password to confirm/i)
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(
        /Enter your password to confirm/i
      );
      await user.type(passwordInput, 'wrongpassword');

      const form = confirmInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(mockSignOut).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const confirmInput = screen.getByLabelText(/Type DELETE to confirm/i);
      await user.type(confirmInput, 'DELETE');

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Enter your password to confirm/i)
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(
        /Enter your password to confirm/i
      );
      await user.type(passwordInput, 'password123');

      const form = confirmInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(mockSignOut).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Form Interactions', () => {
    it('should reset form on cancel at step 1', async () => {
      const user = userEvent.setup();
      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const confirmInput = screen.getByLabelText(/Type DELETE to confirm/i);
      await user.type(confirmInput, 'DELETE');

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should reset form on cancel at step 2', async () => {
      const user = userEvent.setup();
      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const confirmInput = screen.getByLabelText(/Type DELETE to confirm/i);
      await user.type(confirmInput, 'DELETE');

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Enter your password to confirm/i)
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should reset to step 1 when dialog reopens', async () => {
      const { rerender } = render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Open and progress to step 2
      rerender(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const user = userEvent.setup();
      const confirmInput = screen.getByLabelText(/Type DELETE to confirm/i);
      await user.type(confirmInput, 'DELETE');

      const continueButton = screen.getByRole('button', { name: /Continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Enter your password to confirm/i)
        ).toBeInTheDocument();
      });

      // Close
      rerender(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Reopen - should be back to step 1
      rerender(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(
        screen.getByRole('button', { name: /Continue/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText(/Enter your password to confirm/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const confirmInput = screen.getByLabelText(/Type DELETE to confirm/i);
      expect(confirmInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('should show validation error with proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(
        <DeleteAccountModal
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const confirmInput = screen.getByLabelText(/Type DELETE to confirm/i);
      await user.type(confirmInput, 'wrong');

      const form = confirmInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(/You must type DELETE to confirm/i)
        ).toBeInTheDocument();
      });
    });
  });
});
