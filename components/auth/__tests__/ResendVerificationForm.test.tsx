/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResendVerificationForm } from '../ResendVerificationForm';

global.fetch = jest.fn();

describe('ResendVerificationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('should render the form with all elements', () => {
      render(<ResendVerificationForm />);

      expect(
        screen.getByRole('heading', { name: /resend verification email/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /send verification email/i })
      ).toBeInTheDocument();
    });

    it('should render email input field with correct attributes', () => {
      render(<ResendVerificationForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('id', 'email');
      expect(emailInput).not.toBeDisabled();
    });

    it('should pre-fill email when initialEmail prop is provided', () => {
      const testEmail = 'test@example.com';
      render(<ResendVerificationForm initialEmail={testEmail} />);

      const emailInput = screen.getByLabelText(
        /email address/i
      ) as HTMLInputElement;
      expect(emailInput.value).toBe(testEmail);
    });

    it('should have empty email field when no initialEmail provided', () => {
      render(<ResendVerificationForm />);

      const emailInput = screen.getByLabelText(
        /email address/i
      ) as HTMLInputElement;
      expect(emailInput.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<ResendVerificationForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send verification email/i,
      });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show validation error for empty email', async () => {
      const user = userEvent.setup();
      render(<ResendVerificationForm />);

      const submitButton = screen.getByRole('button', {
        name: /send verification email/i,
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should clear validation error when user corrects email', async () => {
      const user = userEvent.setup();
      render(<ResendVerificationForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send verification email/i,
      });

      await user.type(emailInput, 'invalid');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });

      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      await waitFor(() => {
        expect(
          screen.queryByText(/invalid email address/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission - Success', () => {
    it('should call API with correct payload on valid submission', async () => {
      const user = userEvent.setup();
      const testEmail = 'test@example.com';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message:
            'If this email exists, we sent a verification link. Please check your inbox.',
        }),
      });

      render(<ResendVerificationForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send verification email/i,
      });

      await user.type(emailInput, testEmail);
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/resend-verification',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: testEmail }),
          }
        );
      });
    });

    it('should show success message after successful submission', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message:
            'If this email exists, we sent a verification link. Please check your inbox.',
        }),
      });

      render(<ResendVerificationForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send verification email/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /check your email/i })
        ).toBeInTheDocument();
        expect(
          screen.getByText(/we've sent a new verification link/i)
        ).toBeInTheDocument();
      });
    });

    it('should replace form with success card on successful submission', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Success' }),
      });

      render(<ResendVerificationForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(
        screen.getByRole('button', { name: /send verification email/i })
      );

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /send verification email/i })
        ).not.toBeInTheDocument();
        expect(
          screen.queryByLabelText(/email address/i)
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole('heading', { name: /check your email/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission - Rate Limit', () => {
    it('should show rate limit error when API returns 429', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          message: 'Please wait before requesting another verification email.',
          retryAfter: 540,
        }),
      });

      render(<ResendVerificationForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(
        screen.getByRole('button', { name: /send verification email/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/please wait before requesting another email/i)
        ).toBeInTheDocument();
      });
    });

    it('should keep form visible after rate limit error', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          message: 'Rate limited',
          retryAfter: 540,
        }),
      });

      render(<ResendVerificationForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      await user.click(
        screen.getByRole('button', { name: /send verification email/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/please wait before requesting another email/i)
        ).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /send verification email/i })
      ).toBeInTheDocument();
    });
  });

  describe('Form Submission - Generic Errors', () => {
    it('should show generic error when API returns non-429 error', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      render(<ResendVerificationForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      await user.click(
        screen.getByRole('button', { name: /send verification email/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/something went wrong\. please try again\./i)
        ).toBeInTheDocument();
      });
    });

    it('should show generic error when fetch throws exception', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<ResendVerificationForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      await user.click(
        screen.getByRole('button', { name: /send verification email/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/something went wrong\. please try again\./i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();

      let resolveFetch!: (value: { ok: boolean; status: number }) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

      render(<ResendVerificationForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      await user.click(
        screen.getByRole('button', { name: /send verification email/i })
      );

      expect(
        screen.getByRole('button', { name: /sending verification email/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/sending\.\.\./i)).toBeInTheDocument();

      resolveFetch({
        ok: true,
        status: 200,
      });

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /check your email/i })
        ).toBeInTheDocument();
      });
    });

    it('should disable submit button during submission', async () => {
      const user = userEvent.setup();

      let resolveFetch!: (value: { ok: boolean; status: number }) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

      render(<ResendVerificationForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      const submitButton = screen.getByRole('button', {
        name: /send verification email/i,
      });

      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      resolveFetch({
        ok: true,
        status: 200,
      });

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /check your email/i })
        ).toBeInTheDocument();
      });
    });

    it('should disable email input during submission', async () => {
      const user = userEvent.setup();

      let resolveFetch!: (value: { ok: boolean; status: number }) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

      render(<ResendVerificationForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(
        screen.getByRole('button', { name: /send verification email/i })
      );

      expect(emailInput).toBeDisabled();

      resolveFetch({
        ok: true,
        status: 200,
      });

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /check your email/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on email input', () => {
      render(<ResendVerificationForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('aria-label', 'Email address');
      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('should set aria-invalid when email validation fails', async () => {
      const user = userEvent.setup();
      render(<ResendVerificationForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid');
      await user.click(
        screen.getByRole('button', { name: /send verification email/i })
      );

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      });
    });

    it('should have role=alert on validation error message', async () => {
      const user = userEvent.setup();
      render(<ResendVerificationForm />);

      await user.type(screen.getByLabelText(/email address/i), 'invalid');
      await user.click(
        screen.getByRole('button', { name: /send verification email/i })
      );

      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid email address/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should associate label with input using htmlFor', () => {
      render(<ResendVerificationForm />);

      const label = screen.getByText('Email address', {
        selector: 'label',
      });
      const input = screen.getByLabelText(/email address/i);

      expect(label).toHaveAttribute('for', 'email');
      expect(input).toHaveAttribute('id', 'email');
    });

    it('should have descriptive button aria-label', () => {
      render(<ResendVerificationForm />);

      const submitButton = screen.getByRole('button', {
        name: /send verification email/i,
      });
      expect(submitButton).toHaveAttribute(
        'aria-label',
        'Send verification email'
      );
    });

    it('should update button aria-label during loading state', async () => {
      const user = userEvent.setup();

      let resolveFetch!: (value: { ok: boolean; status: number }) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

      render(<ResendVerificationForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      await user.click(
        screen.getByRole('button', { name: /send verification email/i })
      );

      const loadingButton = screen.getByRole('button', {
        name: /sending verification email/i,
      });
      expect(loadingButton).toHaveAttribute(
        'aria-label',
        'Sending verification email'
      );

      resolveFetch({
        ok: true,
        status: 200,
      });

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /check your email/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error State Management', () => {
    it('should clear previous error when submitting again', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ message: 'Success' }),
        });

      render(<ResendVerificationForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      await user.click(
        screen.getByRole('button', { name: /send verification email/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/something went wrong\. please try again\./i)
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: /send verification email/i })
      );

      await waitFor(() => {
        expect(
          screen.queryByText(/something went wrong\. please try again\./i)
        ).not.toBeInTheDocument();
      });
    });
  });
});
