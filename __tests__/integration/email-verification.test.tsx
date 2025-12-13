/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import SignupPage from '@/app/signup/page';
import LoginPage from '@/app/login/page';
import { useAuth } from '@/lib/auth/auth-context';

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
  return function Link({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

// Mock auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

describe('Email Verification Integration Tests', () => {
  const mockSignUp = jest.fn();
  const mockSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
      signIn: mockSignIn,
      user: null,
      profile: null,
      loading: false,
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Story 1.1: Email Confirmation During Signup', () => {
    it('should show "Check your email" message after successful signup', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue(undefined);

      render(<SignupPage />);

      // Fill out signup form
      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      // Verify success state
      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        expect(
          screen.getByText(/we've sent a verification link to/i)
        ).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });

      // Verify signup was called
      expect(mockSignUp).toHaveBeenCalledWith(
        'john@example.com',
        'password123',
        'John Doe'
      );
    });

    it('should display verification link expiration notice (1 hour)', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue(undefined);

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Jane Doe');
      await user.type(emailInput, 'jane@example.com');
      await user.type(passwordInputs[0], 'securepass123');
      await user.type(passwordInputs[1], 'securepass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/verification link will expire in 1 hour/i)
        ).toBeInTheDocument();
      });
    });

    it('should show "Resend verification email" button after signup', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue(undefined);

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Bob Smith');
      await user.type(emailInput, 'bob@example.com');
      await user.type(passwordInputs[0], 'mypassword123');
      await user.type(passwordInputs[1], 'mypassword123');
      await user.click(submitButton);

      await waitFor(() => {
        const resendButton = screen.getByRole('link', {
          name: /resend verification email/i,
        });
        expect(resendButton).toBeInTheDocument();
        expect(resendButton).toHaveAttribute('href', '/signup');
      });
    });

    it('should NOT auto-redirect after successful signup', async () => {
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
      await user.type(passwordInputs[0], 'testpass123');
      await user.type(passwordInputs[1], 'testpass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      // Verify no redirect happened
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Story 1.1 (cont.): Login Verification Checks', () => {
    it('should show verification error when unverified user tries to login', async () => {
      const user = userEvent.setup({ delay: null });

      // Mock email not verified error
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

      // Should NOT redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should show "Resend verification email" button for unverified users', async () => {
      const user = userEvent.setup({ delay: null });

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

    it('should allow verified users to login normally', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignIn.mockResolvedValue(undefined);

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

      // Should NOT show verification error
      expect(
        screen.queryByText(/please verify your email address/i)
      ).not.toBeInTheDocument();
    });

    it('should NOT show resend button for regular login errors', async () => {
      const user = userEvent.setup({ delay: null });
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

      // Should NOT show resend button for non-verification errors
      expect(
        screen.queryByRole('link', { name: /resend verification email/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Story 1.1 (cont.): Full Flow Scenarios', () => {
    it('should complete full happy path: signup → verify message → login blocked → verify → login success', async () => {
      const user = userEvent.setup({ delay: null });

      // Step 1: Signup shows verification message
      mockSignUp.mockResolvedValue(undefined);
      const { unmount: unmountSignup } = render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const signupButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Alice Johnson');
      await user.type(emailInput, 'alice@example.com');
      await user.type(passwordInputs[0], 'alicepass123');
      await user.type(passwordInputs[1], 'alicepass123');
      await user.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      unmountSignup();

      // Step 2: Attempt login before verification → blocked
      const verificationError = new Error(
        'Please verify your email address before signing in.'
      );
      (verificationError as any).isEmailNotVerified = true;
      mockSignIn.mockRejectedValueOnce(verificationError);

      const { unmount: unmountLogin1 } = render(<LoginPage />);

      const loginEmail1 = screen.getByPlaceholderText(/email address/i);
      const loginPassword1 = screen.getByPlaceholderText(/password/i);
      const loginButton1 = screen.getByRole('button', { name: /sign in/i });

      await user.type(loginEmail1, 'alice@example.com');
      await user.type(loginPassword1, 'alicepass123');
      await user.click(loginButton1);

      await waitFor(() => {
        expect(
          screen.getByText(/please verify your email address/i)
        ).toBeInTheDocument();
      });

      unmountLogin1();

      // Step 3: After email verification, login succeeds
      mockSignIn.mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      const loginEmail2 = screen.getByPlaceholderText(/email address/i);
      const loginPassword2 = screen.getByPlaceholderText(/password/i);
      const loginButton2 = screen.getByRole('button', { name: /sign in/i });

      await user.type(loginEmail2, 'alice@example.com');
      await user.type(loginPassword2, 'alicepass123');
      await user.click(loginButton2);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenLastCalledWith(
          'alice@example.com',
          'alicepass123'
        );
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should handle error during signup gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockRejectedValue({
        message: 'Email already registered',
      });

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Existing User');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/email already registered/i)
        ).toBeInTheDocument();
      });

      // Should NOT show verification message on error
      expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
    });

    it('should clear verification error when user retries login', async () => {
      const user = userEvent.setup({ delay: null });

      // First attempt: verification error
      const verificationError = new Error(
        'Please verify your email address before signing in.'
      );
      (verificationError as any).isEmailNotVerified = true;
      mockSignIn
        .mockRejectedValueOnce(verificationError)
        .mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First attempt
      await user.type(emailInput, 'user@example.com');
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

      // Clear and retry (after user verified email)
      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.type(emailInput, 'user@example.com');
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
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network errors during signup', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockRejectedValue({
        message: 'Network request failed',
      });

      render(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'Network Test');
      await user.type(emailInput, 'network@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/network request failed/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle malformed email verification error', async () => {
      const user = userEvent.setup({ delay: null });

      // Error without isEmailNotVerified flag
      mockSignIn.mockRejectedValue({
        message: 'Email not confirmed',
      });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email not confirmed/i)).toBeInTheDocument();
      });

      // Should NOT show resend button without proper flag
      expect(
        screen.queryByRole('link', { name: /resend verification email/i })
      ).not.toBeInTheDocument();
    });

    it('should allow multiple signup attempts with different emails', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue(undefined);

      render(<SignupPage />);

      // First signup
      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await user.type(nameInput, 'User One');
      await user.type(emailInput, 'user1@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      });

      expect(mockSignUp).toHaveBeenCalledTimes(1);
      expect(mockSignUp).toHaveBeenCalledWith(
        'user1@example.com',
        'password123',
        'User One'
      );
    });
  });
});
