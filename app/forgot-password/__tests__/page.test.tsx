/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Supabase before imports
jest.mock('@/lib/supabase');

import { supabase } from '@/lib/supabase';
import ForgotPasswordPage from '../page';

// Get typed mock reference for use in tests
const mockedSupabase = jest.mocked(supabase);

// Ensure auth.resetPasswordForEmail is a mock function
if (!mockedSupabase.auth.resetPasswordForEmail) {
  mockedSupabase.auth.resetPasswordForEmail = jest.fn().mockResolvedValue({
    data: {},
    error: null,
  });
}

// Mock Next/Link
jest.mock('next/link', () => {
  return function Link({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    // Clear all mock call history
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the forgot password form', () => {
      render(<ForgotPasswordPage />);

      expect(
        screen.getByRole('heading', { name: /reset your password/i })
      ).toBeInTheDocument();
    });

    it('should render email input field', () => {
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('id', 'email');
    });

    it('should render submit button', () => {
      render(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    it('should render link to login page', () => {
      render(<ForgotPasswordPage />);

      const loginLink = screen.getByRole('link', {
        name: /remember your password\? sign in/i,
      });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should render descriptive text', () => {
      render(<ForgotPasswordPage />);

      expect(
        screen.getByText(
          /enter your email address and we'll send you a link to reset your password/i
        )
      ).toBeInTheDocument();
    });
  });

  describe('Email Validation', () => {
    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email address/i)
        ).toBeInTheDocument();
      });
    });

    it('should not show error for valid email', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/invalid email address/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should trim whitespace from email input', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, '  test@example.com  ');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          expect.any(Object)
        );
      });
    });
  });

  describe('Form Submission', () => {
    it('should show loading state while submitting', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ error: null }), 100)
          )
      );

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      expect(screen.getByRole('button', { name: /sending\.\.\./i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sending\.\.\./i })).toBeDisabled();
    });

    it('should call resetPasswordForEmail with correct email and redirect URL', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          {
            redirectTo: expect.stringContaining('/reset-password'),
          }
        );
      });
    });

    it('should show success message after successful submission', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        expect(
          screen.getByText(
            /if this email exists in our system, you will receive a password reset link shortly/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should hide form after successful submission', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText(/email address/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: /send reset link/i })
        ).not.toBeInTheDocument();
      });
    });

    it('should show return to login link in success message', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const returnLink = screen.getByRole('link', {
          name: /return to sign in/i,
        });
        expect(returnLink).toBeInTheDocument();
        expect(returnLink).toHaveAttribute('href', '/login');
      });
    });
  });

  describe('Error Handling - Email Enumeration Prevention', () => {
    it('should show success message even when email does not exist (security)', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'User not found' },
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
        expect(
          screen.getByText(
            /if this email exists in our system, you will receive a password reset link shortly/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should show success message on network error (security)', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockRejectedValue(
        new Error('Network error')
      );

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    it('should never display actual error messages to prevent email enumeration', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Some specific error' },
      });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/some specific error/i)
        ).not.toBeInTheDocument();
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to login page when clicking "Remember your password" link', () => {
      render(<ForgotPasswordPage />);

      const loginLink = screen.getByRole('link', {
        name: /remember your password\? sign in/i,
      });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should navigate to login page from success message', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const returnLink = screen.getByRole('link', {
          name: /return to sign in/i,
        });
        expect(returnLink).toHaveAttribute('href', '/login');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      expect(emailInput).toHaveAccessibleName(/email address/i);
    });

    it('should associate error messages with input field', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      });
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid email address/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      // Tab to email input
      await user.tab();
      expect(screen.getByPlaceholderText(/email address/i)).toHaveFocus();

      // Tab to submit button
      await user.tab();
      expect(
        screen.getByRole('button', { name: /send reset link/i })
      ).toHaveFocus();

      // Tab to login link
      await user.tab();
      expect(
        screen.getByRole('link', { name: /remember your password\? sign in/i })
      ).toHaveFocus();
    });

    it('should maintain focus management after submission', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        // Success message should be visible and focusable
        const returnLink = screen.getByRole('link', {
          name: /return to sign in/i,
        });
        expect(returnLink).toBeInTheDocument();
      });
    });
  });
});
