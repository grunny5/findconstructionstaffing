/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock the auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock Next.js navigation
const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Next/Link
jest.mock('next/link', () => {
  return function Link({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

describe('LoginPage', () => {
  const mockSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });
  });

  describe('Rendering', () => {
    it('should render the login form', () => {
      render(<LoginPage />);

      expect(
        screen.getByRole('heading', { name: /sign in to your account/i })
      ).toBeInTheDocument();
    });

    it('should render email input field', () => {
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should render password input field', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should render submit button', () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    it('should render link to signup page', () => {
      render(<LoginPage />);

      const signupLink = screen.getByRole('link', {
        name: /create a new account/i,
      });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid email', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'validpassword123');
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/invalid email address/i)
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should show error for short password', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '12345');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 6 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should not show errors for valid input', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue(undefined);
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/invalid email address/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(/password must be at least 6 characters/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call signIn with correct credentials on valid submission', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue(undefined);
      mockGet.mockReturnValue(null);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });
    });

    it('should redirect to home on successful login', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue(undefined);
      mockGet.mockReturnValue(null);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should redirect to callback URL if provided', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue(undefined);
      mockGet.mockReturnValue('/admin/integrations');

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/integrations');
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      mockGet.mockReturnValue(null);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show loading text
      expect(screen.getByText(/signing in.../i)).toBeInTheDocument();

      // Button should be disabled
      const loadingButton = screen.getByRole('button', {
        name: /signing in.../i,
      });
      expect(loadingButton).toBeDisabled();

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });

    it('should handle sign in error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';
      mockSignIn.mockRejectedValue({ message: errorMessage });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should show generic error message when error has no message', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValue({});

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to sign in/i)).toBeInTheDocument();
      });
    });

    it('should clear error message on new submission', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';
      mockSignIn
        .mockRejectedValueOnce({ message: errorMessage })
        .mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First submission - error
      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Second submission - success
      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.type(emailInput, 'correct@example.com');
      await user.type(passwordInput, 'correctpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<LoginPage />);

      // Email field should have label (screen reader only)
      const emailLabel = screen.getByLabelText(/email address/i);
      expect(emailLabel).toBeInTheDocument();

      // Password field should have label (screen reader only)
      const passwordLabel = screen.getByLabelText(/password/i);
      expect(passwordLabel).toBeInTheDocument();
    });

    it('should have proper autocomplete attributes', () => {
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      expect(emailInput).toHaveAttribute('autoComplete', 'email');

      const passwordInput = screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });
  });

  describe('Email Verification', () => {
    it('should show email verification error when user is not verified', async () => {
      const user = userEvent.setup();
      const verificationError = new Error(
        'Please verify your email address before signing in.'
      );
      (verificationError as any).isEmailNotVerified = true;
      mockSignIn.mockRejectedValue(verificationError);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'unverified@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/please verify your email address/i)
        ).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should show "Resend verification email" button for unverified users', async () => {
      const user = userEvent.setup();
      const verificationError = new Error(
        'Please verify your email address before signing in.'
      );
      (verificationError as any).isEmailNotVerified = true;
      mockSignIn.mockRejectedValue(verificationError);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'unverified@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const resendButton = screen.getByRole('link', {
          name: /resend verification email/i,
        });
        expect(resendButton).toBeInTheDocument();
        expect(resendButton).toHaveAttribute('href', '/signup');
      });
    });

    it('should NOT show "Resend verification email" button for other errors', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValue({ message: 'Invalid credentials' });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Should NOT show resend button
      expect(
        screen.queryByRole('link', { name: /resend verification email/i })
      ).not.toBeInTheDocument();
    });

    it('should clear email verification error on new submission', async () => {
      const user = userEvent.setup();
      const verificationError = new Error(
        'Please verify your email address before signing in.'
      );
      (verificationError as any).isEmailNotVerified = true;
      mockSignIn
        .mockRejectedValueOnce(verificationError)
        .mockResolvedValueOnce(undefined);
      mockGet.mockReturnValue(null);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First submission - unverified error
      await user.type(emailInput, 'unverified@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/please verify your email address/i)
        ).toBeInTheDocument();
        expect(
          screen.getByRole('link', { name: /resend verification email/i })
        ).toBeInTheDocument();
      });

      // Second submission - success (user verified their email)
      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.type(emailInput, 'verified@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/please verify your email address/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('link', { name: /resend verification email/i })
        ).not.toBeInTheDocument();
      });
    });

    it('should allow verified users to login normally', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue(undefined);
      mockGet.mockReturnValue(null);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'verified@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          'verified@example.com',
          'password123'
        );
        expect(mockPush).toHaveBeenCalledWith('/');
      });

      // Should NOT show any verification errors
      expect(
        screen.queryByText(/please verify your email address/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /resend verification email/i })
      ).not.toBeInTheDocument();
    });
  });
});
