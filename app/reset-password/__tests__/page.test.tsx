/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase');

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ResetPasswordPage from '../page';

// Get typed mock references
const mockedRouter = jest.mocked(useRouter);
const mockedSupabase = jest.mocked(supabase);

// Ensure auth.updateUser and auth.getSession are mock functions
if (!mockedSupabase.auth.updateUser) {
  mockedSupabase.auth.updateUser = jest.fn().mockResolvedValue({
    data: { user: null },
    error: null,
  });
}

if (!mockedSupabase.auth.getSession) {
  mockedSupabase.auth.getSession = jest.fn().mockResolvedValue({
    data: { session: null },
    error: null,
  });
}

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

describe('ResetPasswordPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);

    // Mock window.location.hash
    delete (window as any).location;
    (window as any).location = { hash: '' };
  });

  describe('Token Validation', () => {
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
          screen.getByText(/the reset link is invalid or missing/i)
        ).toBeInTheDocument();
      });
    });

    it('should show link to request new reset when token is missing', async () => {
      (window as any).location.hash = '';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        const link = screen.getByText(/request new reset link/i);
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/forgot-password');
      });
    });

    it('should show expired error when session is invalid', async () => {
      (window as any).location.hash = '#access_token=expired-token';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText(/link expired/i)).toBeInTheDocument();
        expect(screen.getByText(/this link has expired/i)).toBeInTheDocument();
      });
    });

    it('should show form when token is valid', async () => {
      (window as any).location.hash = '#access_token=valid-token';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-123', email: 'test@example.com' } as any,
          },
        },
        error: null,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /reset your password/i })
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/new password/i)
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/confirm password/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Form Rendering', () => {
    beforeEach(async () => {
      (window as any).location.hash = '#access_token=valid-token';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-123', email: 'test@example.com' } as any,
          },
        },
        error: null,
      });
    });

    it('should render password input fields', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText(/new password/i);
        const confirmInput = screen.getByPlaceholderText(/confirm password/i);

        expect(passwordInput).toBeInTheDocument();
        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(passwordInput).toHaveAttribute('id', 'password');

        expect(confirmInput).toBeInTheDocument();
        expect(confirmInput).toHaveAttribute('type', 'password');
        expect(confirmInput).toHaveAttribute('id', 'confirmPassword');
      });
    });

    it('should render submit button', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', {
          name: /reset password/i,
        });
        expect(submitButton).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Password Validation', () => {
    beforeEach(async () => {
      (window as any).location.hash = '#access_token=valid-token';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-123', email: 'test@example.com' } as any,
          },
        },
        error: null,
      });
    });

    it('should show error for password less than 12 characters', async () => {
      const user = userEvent.setup();
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

      await user.type(passwordInput, 'short123');
      await user.type(confirmInput, 'short123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 12 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
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
      await user.type(confirmInput, 'password456');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it('should not show error for valid matching passwords', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
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

      await user.type(passwordInput, 'validpassword123');
      await user.type(confirmInput, 'validpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/password must be at least 12 characters/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(/passwords don't match/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      (window as any).location.hash = '#access_token=valid-token';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-123', email: 'test@example.com' } as any,
          },
        },
        error: null,
      });
    });

    it('should show loading state while submitting', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.updateUser.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { user: { id: 'user-123' } as any },
                  error: null,
                }),
              100
            )
          )
      );

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

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      expect(
        screen.getByRole('button', { name: /updating password\.\.\./i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /updating password\.\.\./i })
      ).toBeDisabled();
    });

    it('should call updateUser with new password', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
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

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedSupabase.auth.updateUser).toHaveBeenCalledWith({
          password: 'newpassword123',
        });
      });
    });

    it('should show success message after successful update', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
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

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password updated successfully/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/you will be redirected to the login page/i)
        ).toBeInTheDocument();
      });
    });

    it('should hide form after successful update', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
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

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText(/new password/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByPlaceholderText(/confirm password/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should redirect to login after successful update', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      mockedSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
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

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password updated successfully/i)
        ).toBeInTheDocument();
      });

      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000);

      expect(mockPush).toHaveBeenCalledWith('/login');

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      (window as any).location.hash = '#access_token=valid-token';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-123', email: 'test@example.com' } as any,
          },
        },
        error: null,
      });
    });

    it('should show error message on update failure', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Password is too weak',
          name: 'AuthApiError',
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

      // Use valid length password that will pass validation but fail at Supabase level
      await user.type(passwordInput, 'validpassword123');
      await user.type(confirmInput, 'validpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is too weak/i)).toBeInTheDocument();
      });
    });

    it('should show generic error on network failure', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.updateUser.mockRejectedValue(
        new Error('Network error')
      );

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

      await user.type(passwordInput, 'validpassword123');
      await user.type(confirmInput, 'validpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      (window as any).location.hash = '#access_token=valid-token';
      mockedSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: { id: 'user-123', email: 'test@example.com' } as any,
          },
        },
        error: null,
      });
    });

    it('should have accessible form labels', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText(/new password/i);
        const confirmInput = screen.getByPlaceholderText(/confirm password/i);

        expect(passwordInput).toHaveAccessibleName(/new password/i);
        expect(confirmInput).toHaveAccessibleName(/confirm password/i);
      });
    });

    it('should associate error messages with input fields', async () => {
      const user = userEvent.setup();
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

      await user.type(passwordInput, '12345');
      await user.type(confirmInput, '12345');
      await user.click(submitButton);

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
        expect(passwordInput).toHaveAttribute(
          'aria-describedby',
          'password-error'
        );
      });
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
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

      await user.type(passwordInput, '12345');
      await user.type(confirmInput, '12345');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(
          /password must be at least 12 characters/i
        );
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});
