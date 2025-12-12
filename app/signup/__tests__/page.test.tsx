/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupPage from '../page';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';

// Mock the auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock Next.js navigation
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Next/Link
jest.mock('next/link', () => {
  return function Link({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

describe('SignupPage', () => {
  const mockSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Use fake timers to prevent test pollution from setTimeout
    jest.useFakeTimers();

    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    // Run any pending timers and restore real timers
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the signup form', () => {
      render(<SignupPage />);

      expect(
        screen.getByRole('heading', { name: /create your account/i })
      ).toBeInTheDocument();
    });

    it('should render full name input field', () => {
      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('type', 'text');
    });

    it('should render email input field', () => {
      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should render password input fields', () => {
      render(<SignupPage />);

      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      expect(passwordInputs).toHaveLength(2);
      expect(passwordInputs[0]).toHaveAttribute('type', 'password');
      expect(passwordInputs[1]).toHaveAttribute('type', 'password');
    });

    it('should render submit button', () => {
      render(<SignupPage />);

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    it('should render link to login page', () => {
      render(<SignupPage />);

      const loginLink = screen.getByRole('link', {
        name: /sign in to existing account/i,
      });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Form Validation', () => {
    it('should show error for short name', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'A');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/name must be at least 2 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error for invalid email', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInputs[0], 'validpassword123');
      await user.type(passwordInputs[1], 'validpassword123');
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
      const user = userEvent.setup({ delay: null });
      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], '12345');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 6 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password456');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it('should not show errors for valid input', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue(undefined);
      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/name must be at least 2 characters/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(/invalid email address/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(/passwords don't match/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call signUp with correct data on valid submission', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue(undefined);

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'Test User'
        );
      });
    });

    it('should show success message after signup', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue(undefined);

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/account created successfully!/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/please check your email to verify your account/i)
        ).toBeInTheDocument();
      });
    });

    it('should redirect to home after successful signup', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue(undefined);

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/account created successfully!/i)
        ).toBeInTheDocument();
      });

      // Fast-forward time to trigger redirect (component uses setTimeout with 2000ms)
      jest.advanceTimersByTime(2000);

      // Verify redirect was called
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      // Wait for loading state to appear
      await waitFor(() => {
        expect(screen.getByText(/creating account.../i)).toBeInTheDocument();
      });

      // Button should be disabled
      const loadingButton = screen.getByRole('button', {
        name: /creating account.../i,
      });
      expect(loadingButton).toBeDisabled();

      // Fast-forward the mock signup delay
      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(
          screen.getByText(/account created successfully!/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle signup error', async () => {
      const user = userEvent.setup({ delay: null });
      const errorMessage = 'Email already exists';
      mockSignUp.mockRejectedValue({ message: errorMessage });

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'valid@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Should not show success message
      expect(
        screen.queryByText(/account created successfully!/i)
      ).not.toBeInTheDocument();

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should show generic error message when error has no message', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockRejectedValue({});

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to create account/i)
        ).toBeInTheDocument();
      });
    });

    it('should clear error message on new submission', async () => {
      const user = userEvent.setup({ delay: null });
      const errorMessage = 'Email already exists';
      mockSignUp
        .mockRejectedValueOnce({ message: errorMessage })
        .mockResolvedValueOnce(undefined);

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      // First submission - error
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Second submission - success
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<SignupPage />);

      // All fields should have labels (screen reader only)
      const nameLabel = screen.getByLabelText(/full name/i);
      expect(nameLabel).toBeInTheDocument();

      const emailLabel = screen.getByLabelText(/email address/i);
      expect(emailLabel).toBeInTheDocument();

      const passwordLabel = screen.getByLabelText(/^password$/i);
      expect(passwordLabel).toBeInTheDocument();

      const confirmPasswordLabel = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordLabel).toBeInTheDocument();
    });

    it('should have proper autocomplete attributes', () => {
      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      expect(nameInput).toHaveAttribute('autoComplete', 'name');

      const emailInput = screen.getByPlaceholderText(/email address/i);
      expect(emailInput).toHaveAttribute('autoComplete', 'email');

      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      expect(passwordInputs[0]).toHaveAttribute('autoComplete', 'new-password');
      expect(passwordInputs[1]).toHaveAttribute('autoComplete', 'new-password');
    });
  });
});
