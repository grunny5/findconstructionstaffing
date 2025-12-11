/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('should show error for short password', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '12345' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 6 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should not show errors for valid input', async () => {
      mockSignIn.mockResolvedValue(undefined);
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

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
      mockSignIn.mockResolvedValue(undefined);
      mockGet.mockReturnValue(null);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'password123' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });
    });

    it('should redirect to home on successful login', async () => {
      mockSignIn.mockResolvedValue(undefined);
      mockGet.mockReturnValue(null);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'password123' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should redirect to callback URL if provided', async () => {
      mockSignIn.mockResolvedValue(undefined);
      mockGet.mockReturnValue('/admin/integrations');

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, {
        target: { value: 'admin@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'password123' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/integrations');
      });
    });

    it('should show loading state during submission', async () => {
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      mockGet.mockReturnValue(null);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'password123' },
      });
      fireEvent.click(submitButton);

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
      const errorMessage = 'Invalid credentials';
      mockSignIn.mockRejectedValue({ message: errorMessage });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, {
        target: { value: 'wrong@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should show generic error message when error has no message', async () => {
      mockSignIn.mockRejectedValue({});

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'password123' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to sign in/i)).toBeInTheDocument();
      });
    });

    it('should clear error message on new submission', async () => {
      const errorMessage = 'Invalid credentials';
      mockSignIn
        .mockRejectedValueOnce({ message: errorMessage })
        .mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First submission - error
      fireEvent.change(emailInput, {
        target: { value: 'wrong@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Second submission - success
      fireEvent.change(emailInput, {
        target: { value: 'correct@example.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'correctpassword' },
      });
      fireEvent.click(submitButton);

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
});
