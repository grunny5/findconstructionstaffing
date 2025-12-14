/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import ForgotPasswordPage from '@/app/forgot-password/page';
import ResetPasswordPage from '@/app/reset-password/page';
import LoginPage from '@/app/login/page';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase';

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

// Mock Next/Link
jest.mock('next/link', () => {
  return function Link({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock Supabase
jest.mock('@/lib/supabase');

// Mock auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

describe('Password Reset Integration Tests', () => {
  const mockedSupabase = jest.mocked(supabase);
  const mockSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      user: null,
      profile: null,
      loading: false,
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Set up default mock for resetPasswordForEmail
    if (!mockedSupabase.auth.resetPasswordForEmail) {
      mockedSupabase.auth.resetPasswordForEmail = jest.fn();
    }

    // Set up default mock for getSession
    if (!mockedSupabase.auth.getSession) {
      mockedSupabase.auth.getSession = jest.fn();
    }

    // Set up default mock for updateUser
    if (!mockedSupabase.auth.updateUser) {
      mockedSupabase.auth.updateUser = jest.fn();
    }

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { hash: '' };
  });

  describe('Story 2.1: Request Password Reset', () => {
    it('should show success message after requesting password reset', async () => {
      const user = userEvent.setup({ delay: null });
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        expect(
          screen.getByText(
            /if this email exists in our system, you will receive a password reset link shortly/i
          )
        ).toBeInTheDocument();
      });

      expect(mockedSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password'),
        })
      );
    });

    it('should show success even for non-existent email (security)', async () => {
      const user = userEvent.setup({ delay: null });
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'nonexistent@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      // Should still show success to prevent email enumeration
      expect(screen.queryByText(/email not found/i)).not.toBeInTheDocument();
    });

    it('should validate email format before submission', async () => {
      const user = userEvent.setup({ delay: null });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });

      // Should not call API with invalid email
      expect(mockedSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully (shows success to prevent enumeration)', async () => {
      const user = userEvent.setup({ delay: null });
      mockedSupabase.auth.resetPasswordForEmail.mockRejectedValue({
        message: 'Network request failed',
      });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      // Even on error, should show success to prevent email enumeration
      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Story 2.2: Reset Password with Token', () => {
    it('should show reset form when valid token is present', async () => {
      (window as any).location.hash = '#access_token=valid-token-123';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token-123',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-123', email: 'user@example.com' } as any,
          },
        },
        error: null,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/new password/i)
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/confirm password/i)
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /reset password/i })
        ).toBeInTheDocument();
      });
    });

    it('should show error when token is missing', async () => {
      (window as any).location.hash = '';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
        expect(
          screen.getByText(/this password reset link is invalid or missing/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error when token is expired', async () => {
      (window as any).location.hash = '#access_token=expired-token';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: {
          message: 'Token expired',
          name: 'AuthError',
          status: 401,
        } as any,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText(/link expired/i)).toBeInTheDocument();
        expect(
          screen.getByText(/password reset links are valid for 1 hour/i)
        ).toBeInTheDocument();
      });
    });

    it('should successfully reset password with valid token', async () => {
      const user = userEvent.setup({ delay: null });
      (window as any).location.hash = '#access_token=valid-token-456';

      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token-456',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-456', email: 'user@example.com' } as any,
          },
        },
        error: null,
      });

      mockedSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-456' } as any },
        error: null,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/new password/i)
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'newSecurePass123');
      await user.type(confirmInput, 'newSecurePass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password updated successfully/i)
        ).toBeInTheDocument();
      });

      expect(mockedSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newSecurePass123',
      });
    });

    it('should validate password minimum length', async () => {
      const user = userEvent.setup({ delay: null });
      (window as any).location.hash = '#access_token=valid-token-789';

      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token-789',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-789', email: 'user@example.com' } as any,
          },
        },
        error: null,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/new password/i)
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'short');
      await user.type(confirmInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 6 characters/i)
        ).toBeInTheDocument();
      });

      expect(mockedSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should validate passwords match', async () => {
      const user = userEvent.setup({ delay: null });
      (window as any).location.hash = '#access_token=valid-token-abc';

      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token-abc',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-abc', email: 'user@example.com' } as any,
          },
        },
        error: null,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/new password/i)
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'password123');
      await user.type(confirmInput, 'different456');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });

      expect(mockedSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should handle weak password error from Supabase', async () => {
      const user = userEvent.setup({ delay: null });
      (window as any).location.hash = '#access_token=valid-token-def';

      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token-def',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-def', email: 'user@example.com' } as any,
          },
        },
        error: null,
      });

      mockedSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Password is too weak',
          name: 'AuthError',
          status: 400,
        } as any,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/new password/i)
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'weakpass');
      await user.type(confirmInput, 'weakpass');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is too weak/i)).toBeInTheDocument();
      });
    });
  });

  describe('Full Password Reset Flow', () => {
    it('should complete full flow: request reset → reset password → login with new password', async () => {
      const user = userEvent.setup({ delay: null });

      // Step 1: Request password reset
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const { unmount: unmountForgot } = render(<ForgotPasswordPage />);

      const forgotEmailInput = screen.getByPlaceholderText(/email address/i);
      const forgotSubmitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(forgotEmailInput, 'alice@example.com');
      await user.click(forgotSubmitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      unmountForgot();

      // Step 2: User clicks email link and lands on reset page with token
      (window as any).location.hash = '#access_token=reset-token-alice';

      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'reset-token-alice',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'alice-123', email: 'alice@example.com' } as any,
          },
        },
        error: null,
      });

      mockedSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'alice-123' } as any },
        error: null,
      });

      const { unmount: unmountReset } = render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/new password/i)
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm password/i);
      const resetButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'newAlicePass123');
      await user.type(confirmInput, 'newAlicePass123');
      await user.click(resetButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password updated successfully/i)
        ).toBeInTheDocument();
      });

      unmountReset();

      // Step 3: User logs in with new password
      mockSignIn.mockResolvedValue(undefined);

      render(<LoginPage />);

      const loginEmailInput = screen.getByPlaceholderText(/email address/i);
      const loginPasswordInput = screen.getByPlaceholderText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(loginEmailInput, 'alice@example.com');
      await user.type(loginPasswordInput, 'newAlicePass123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          'alice@example.com',
          'newAlicePass123'
        );
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should handle expired token and allow requesting new reset', async () => {
      const user = userEvent.setup({ delay: null });

      // User clicks expired reset link
      (window as any).location.hash = '#access_token=expired-token-xyz';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: {
          message: 'Token expired',
          name: 'AuthError',
          status: 401,
        } as any,
      });

      const { unmount: unmountReset } = render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText(/link expired/i)).toBeInTheDocument();
      });

      // User clicks link to request new reset
      const requestNewLink = screen.getByRole('link', {
        name: /request new reset link/i,
      });
      expect(requestNewLink).toHaveAttribute('href', '/forgot-password');

      unmountReset();

      // User requests new reset
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid token and show appropriate error', async () => {
      (window as any).location.hash = '#access_token=invalid-token';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        // Token in hash but session null = expired/invalid
        expect(screen.getByText(/link expired/i)).toBeInTheDocument();
        expect(
          screen.getByText(/password reset links are valid for 1 hour/i)
        ).toBeInTheDocument();
        expect(
          screen.getByRole('link', { name: /request new reset link/i })
        ).toHaveAttribute('href', '/forgot-password');
      });
    });
  });

  describe('Edge Cases and Security', () => {
    it('should not expose whether email exists in system', async () => {
      const user = userEvent.setup({ delay: null });
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      // Try with non-existent email
      await user.type(emailInput, 'nonexistent@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      // Should show same message as if email existed
      expect(screen.queryByText(/email not found/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/no account with that email/i)
      ).not.toBeInTheDocument();
    });

    it('should prevent reusing old password (if Supabase enforces)', async () => {
      const user = userEvent.setup({ delay: null });
      (window as any).location.hash = '#access_token=valid-token-reuse';

      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token-reuse',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-reuse', email: 'user@example.com' } as any,
          },
        },
        error: null,
      });

      mockedSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'New password should be different from the old password',
          name: 'AuthError',
          status: 422,
        } as any,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/new password/i)
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'oldPassword123');
      await user.type(confirmInput, 'oldPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /new password should be different from the old password/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should clear form errors when user retries', async () => {
      const user = userEvent.setup({ delay: null });
      (window as any).location.hash = '#access_token=valid-token-retry';

      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token-retry',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-retry', email: 'user@example.com' } as any,
          },
        },
        error: null,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/new password/i)
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      // First attempt: passwords don't match
      await user.type(passwordInput, 'password123');
      await user.type(confirmInput, 'different456');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });

      // Clear and retry
      await user.clear(passwordInput);
      await user.clear(confirmInput);

      mockedSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-retry' } as any },
        error: null,
      });

      await user.type(passwordInput, 'newPassword123');
      await user.type(confirmInput, 'newPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/passwords don't match/i)
        ).not.toBeInTheDocument();
        expect(
          screen.getByText(/password updated successfully/i)
        ).toBeInTheDocument();
      });
    });
  });
});
