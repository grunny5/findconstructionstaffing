/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordChangeForm } from '../PasswordChangeForm';

// Mock Supabase before importing
const mockSignInWithPassword = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

// Import after mocking
import { supabase } from '@/lib/supabase';

// Replace the mocked functions with our test mocks
(supabase.auth.signInWithPassword as jest.Mock) = mockSignInWithPassword;
(supabase.auth.updateUser as jest.Mock) = mockUpdateUser;

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('PasswordChangeForm', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSuccess = jest.fn();
  const currentEmail = 'user@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render form when open', () => {
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(
        screen.getByRole('heading', { name: /Change Password/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Current Password \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^New Password \*/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Confirm New Password \*/i)
      ).toBeInTheDocument();
    });

    it('should have submit button disabled initially', () => {
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const submitButton = screen.getByRole('button', {
        name: /Change Password/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('should show password as masked by default', () => {
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const currentPasswordInput = screen.getByLabelText(
        /Current Password \*/i
      ) as HTMLInputElement;
      const newPasswordInput = screen.getByLabelText(
        /^New Password \*/i
      ) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password \*/i
      ) as HTMLInputElement;

      expect(currentPasswordInput.type).toBe('password');
      expect(newPasswordInput.type).toBe('password');
      expect(confirmPasswordInput.type).toBe('password');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle current password visibility', async () => {
      const user = userEvent.setup();
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const currentPasswordInput = screen.getByLabelText(
        /Current Password \*/i
      ) as HTMLInputElement;
      const toggleButton = screen.getByLabelText(/Show current password/i);

      expect(currentPasswordInput.type).toBe('password');

      await user.click(toggleButton);

      expect(currentPasswordInput.type).toBe('text');
      expect(
        screen.getByLabelText(/Hide current password/i)
      ).toBeInTheDocument();
    });

    it('should toggle new password visibility', async () => {
      const user = userEvent.setup();
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const newPasswordInput = screen.getByLabelText(
        /^New Password \*/i
      ) as HTMLInputElement;
      const toggleButton = screen.getByLabelText(/Show new password/i);

      expect(newPasswordInput.type).toBe('password');

      await user.click(toggleButton);

      expect(newPasswordInput.type).toBe('text');
      expect(screen.getByLabelText(/Hide new password/i)).toBeInTheDocument();
    });

    it('should toggle confirm password visibility', async () => {
      const user = userEvent.setup();
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password \*/i
      ) as HTMLInputElement;
      const toggleButton = screen.getByLabelText(/Show confirm password/i);

      expect(confirmPasswordInput.type).toBe('password');

      await user.click(toggleButton);

      expect(confirmPasswordInput.type).toBe('text');
      expect(
        screen.getByLabelText(/Hide confirm password/i)
      ).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require current password', async () => {
      const user = userEvent.setup();
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const newPasswordInput = screen.getByLabelText(/^New Password \*/i);
      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password \*/i
      );

      await user.type(newPasswordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      await user.click(
        screen.getByRole('button', { name: /Change Password/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Current password is required/i)
        ).toBeInTheDocument();
      });
    });

    it('should require new password to be at least 6 characters', async () => {
      const user = userEvent.setup();
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const currentPasswordInput =
        screen.getByLabelText(/Current Password \*/i);
      const newPasswordInput = screen.getByLabelText(/^New Password \*/i);
      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password \*/i
      );

      await user.type(currentPasswordInput, 'oldpass');
      await user.type(newPasswordInput, 'short');
      await user.type(confirmPasswordInput, 'short');
      await user.click(
        screen.getByRole('button', { name: /Change Password/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Password must be at least 6 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should require passwords to match', async () => {
      const user = userEvent.setup();
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const currentPasswordInput =
        screen.getByLabelText(/Current Password \*/i);
      const newPasswordInput = screen.getByLabelText(/^New Password \*/i);
      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password \*/i
      );

      await user.type(currentPasswordInput, 'oldpassword');
      await user.type(newPasswordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'differentpassword');
      await user.click(
        screen.getByRole('button', { name: /Change Password/i })
      );

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should require new password to be different from current', async () => {
      const user = userEvent.setup();
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const currentPasswordInput =
        screen.getByLabelText(/Current Password \*/i);
      const newPasswordInput = screen.getByLabelText(/^New Password \*/i);
      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password \*/i
      );

      await user.type(currentPasswordInput, 'samepassword');
      await user.type(newPasswordInput, 'samepassword');
      await user.type(confirmPasswordInput, 'samepassword');
      await user.click(
        screen.getByRole('button', { name: /Change Password/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(
            /New password must be different from current password/i
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('Password Change Success', () => {
    it('should successfully change password with valid credentials', async () => {
      const user = userEvent.setup();
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: '123' } as any, session: {} as any },
        error: null,
      });
      mockUpdateUser.mockResolvedValue({
        data: { user: { id: '123' } as any },
        error: null,
      });

      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const currentPasswordInput =
        screen.getByLabelText(/Current Password \*/i);
      const newPasswordInput = screen.getByLabelText(/^New Password \*/i);
      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password \*/i
      );

      await user.type(currentPasswordInput, 'currentpassword');
      await user.type(newPasswordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');

      // Submit form directly
      const form = currentPasswordInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: currentEmail,
          password: 'currentpassword',
        });
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          password: 'newpassword123',
        });
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should show success message after password change', async () => {
      const user = userEvent.setup();
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: '123' } as any, session: {} as any },
        error: null,
      });
      mockUpdateUser.mockResolvedValue({
        data: { user: { id: '123' } as any },
        error: null,
      });

      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const currentPasswordInput =
        screen.getByLabelText(/Current Password \*/i);
      const newPasswordInput = screen.getByLabelText(/^New Password \*/i);
      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password \*/i
      );

      await user.type(currentPasswordInput, 'currentpassword');
      await user.type(newPasswordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');

      const form = currentPasswordInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(/Password Changed Successfully/i)
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          /You remain logged in and can continue using your account/i
        )
      ).toBeInTheDocument();
    });

    it('should close dialog after viewing success message', async () => {
      const user = userEvent.setup();
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: '123' } as any, session: {} as any },
        error: null,
      });
      mockUpdateUser.mockResolvedValue({
        data: { user: { id: '123' } as any },
        error: null,
      });

      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const currentPasswordInput =
        screen.getByLabelText(/Current Password \*/i);
      const newPasswordInput = screen.getByLabelText(/^New Password \*/i);
      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password \*/i
      );

      await user.type(currentPasswordInput, 'currentpassword');
      await user.type(newPasswordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');

      const form = currentPasswordInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(/Password Changed Successfully/i)
        ).toBeInTheDocument();
      });

      const gotItButton = screen.getByRole('button', { name: /Got it/i });
      await user.click(gotItButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Error Handling', () => {
    it('should show error for incorrect current password', async () => {
      const user = userEvent.setup();
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' } as any,
      });

      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const currentPasswordInput =
        screen.getByLabelText(/Current Password \*/i);
      const newPasswordInput = screen.getByLabelText(/^New Password \*/i);
      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password \*/i
      );

      await user.type(currentPasswordInput, 'wrongpassword');
      await user.type(newPasswordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');

      const form = currentPasswordInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalled();
      });

      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      const user = userEvent.setup();
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: '123' } as any, session: {} as any },
        error: null,
      });
      mockUpdateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password update failed' } as any,
      });

      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const currentPasswordInput =
        screen.getByLabelText(/Current Password \*/i);
      const newPasswordInput = screen.getByLabelText(/^New Password \*/i);
      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password \*/i
      );

      await user.type(currentPasswordInput, 'currentpassword');
      await user.type(newPasswordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');

      const form = currentPasswordInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should enable submit button when form is dirty and valid', async () => {
      const user = userEvent.setup();
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const submitButton = screen.getByRole('button', {
        name: /Change Password/i,
      });
      expect(submitButton).toBeDisabled();

      const currentPasswordInput =
        screen.getByLabelText(/Current Password \*/i);
      await user.type(currentPasswordInput, 'current');

      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });

    it('should reset form on cancel', async () => {
      const user = userEvent.setup();
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const currentPasswordInput =
        screen.getByLabelText(/Current Password \*/i);
      const newPasswordInput = screen.getByLabelText(/^New Password \*/i);

      await user.type(currentPasswordInput, 'currentpassword');
      await user.type(newPasswordInput, 'newpassword123');

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should reset form when dialog reopens', async () => {
      const { rerender } = render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Open dialog and fill form
      rerender(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const user = userEvent.setup();
      const currentPasswordInput =
        screen.getByLabelText(/Current Password \*/i);
      await user.type(currentPasswordInput, 'test');

      // Close dialog
      rerender(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Reopen dialog
      rerender(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Form should be reset
      const resetInput = screen.getByLabelText(
        /Current Password \*/i
      ) as HTMLInputElement;
      expect(resetInput.value).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for password fields', () => {
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const currentPasswordInput =
        screen.getByLabelText(/Current Password \*/i);
      const newPasswordInput = screen.getByLabelText(/^New Password \*/i);
      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password \*/i
      );

      expect(currentPasswordInput).toHaveAttribute('aria-invalid', 'false');
      expect(newPasswordInput).toHaveAttribute('aria-invalid', 'false');
      expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('should have proper ARIA labels for visibility toggles', () => {
      render(
        <PasswordChangeForm
          currentEmail={currentEmail}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(
        screen.getByLabelText(/Show current password/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Show new password/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Show confirm password/i)
      ).toBeInTheDocument();
    });
  });
});
