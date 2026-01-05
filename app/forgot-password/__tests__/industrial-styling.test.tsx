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
  return function Link({ children, href, className }: any) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

describe('ForgotPasswordPage - Industrial Design', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Industrial Background and Layout', () => {
    it('should use industrial cream background', () => {
      const { container } = render(<ForgotPasswordPage />);
      const mainDiv = container.firstChild as HTMLElement;

      expect(mainDiv).toHaveClass('bg-industrial-bg-primary');
      expect(mainDiv).toHaveClass('min-h-screen');
    });

    it('should center content with proper spacing', () => {
      const { container } = render(<ForgotPasswordPage />);
      const mainDiv = container.firstChild as HTMLElement;

      expect(mainDiv).toHaveClass('flex items-center justify-center');
      expect(mainDiv).toHaveClass('py-12');
    });

    it('should use max-w-md for content container', () => {
      const { container } = render(<ForgotPasswordPage />);

      const contentContainer = container.querySelector('.max-w-md');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Industrial Typography', () => {
    it('should use font-display for main heading', () => {
      render(<ForgotPasswordPage />);

      const heading = screen.getByRole('heading', {
        name: /reset your password/i,
        level: 1,
      });

      expect(heading).toHaveClass('font-display');
      expect(heading).toHaveClass('uppercase');
      expect(heading).toHaveClass('tracking-wide');
    });

    it('should use font-body for subtitle', () => {
      render(<ForgotPasswordPage />);

      const subtitle = screen.getByText(
        /enter your email address and we'll send you a link/i
      );

      expect(subtitle).toHaveClass('font-body');
      expect(subtitle).toHaveClass('text-industrial-graphite-500');
    });

    it('should use uppercase for card title', () => {
      render(<ForgotPasswordPage />);

      const cardTitle = screen.getByText(/password reset/i);

      expect(cardTitle).toHaveClass('font-display');
      expect(cardTitle).toHaveClass('uppercase');
    });

    it('should use uppercase for label text', () => {
      render(<ForgotPasswordPage />);

      // Get the label specifically (not the subtitle which also contains "email address")
      const label = screen.getByLabelText(/email address/i);
      const labelElement = label.previousElementSibling as HTMLElement;

      expect(labelElement).toHaveClass('uppercase');
      expect(labelElement).toHaveClass('font-semibold');
      expect(labelElement).toHaveClass('tracking-wide');
    });
  });

  describe('Industrial Card Styling', () => {
    it('should use industrial card background and border', () => {
      const { container } = render(<ForgotPasswordPage />);

      // Find the card element
      const card = container.querySelector('.bg-industrial-bg-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-industrial-sharp');
      expect(card).toHaveClass('border-2');
      expect(card).toHaveClass('border-industrial-graphite-200');
    });

    it('should have bordered card header', () => {
      const { container } = render(<ForgotPasswordPage />);

      const cardHeader = container.querySelector('.border-b');
      expect(cardHeader).toBeInTheDocument();
      expect(cardHeader).toHaveClass('border-industrial-graphite-200');
    });
  });

  describe('Industrial Form Elements', () => {
    it('should style email input with industrial design', () => {
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email address/i);

      // Input should have font-body class
      expect(emailInput).toHaveClass('font-body');
    });

    it('should show error messages in orange (not red)', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid email address/i);
        expect(errorMessage).toHaveClass('text-industrial-orange');
        expect(errorMessage).not.toHaveClass('text-red-600');
      });
    });

    it('should style submit button with industrial styling', () => {
      render(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      expect(submitButton).toHaveClass('uppercase');
      expect(submitButton).toHaveClass('font-semibold');
    });
  });

  describe('Industrial Links', () => {
    it('should style login link with orange color', () => {
      const { container } = render(<ForgotPasswordPage />);

      const loginLink = screen.getByRole('link', {
        name: /remember your password\? sign in/i,
      });

      expect(loginLink).toHaveClass('text-industrial-orange');
      expect(loginLink).toHaveClass('font-body');
      // Verify no blue colors anywhere
      expect(
        container.querySelector('[class*="blue"]')
      ).not.toBeInTheDocument();
    });
  });

  describe('Industrial Success State', () => {
    it('should show orange checkmark icon (not green)', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const { container } = render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        // Check for orange icon container
        const iconContainer = container.querySelector(
          '.bg-industrial-orange-100'
        );
        expect(iconContainer).toBeInTheDocument();
        expect(iconContainer).toHaveClass('rounded-industrial-sharp');

        // Verify no green colors
        expect(container.querySelector('.bg-green-50')).not.toBeInTheDocument();
        expect(
          container.querySelector('.text-green-400')
        ).not.toBeInTheDocument();
      });
    });

    it('should use industrial typography in success state', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const successHeading = screen.getByRole('heading', {
          name: /check your email/i,
        });

        expect(successHeading).toHaveClass('font-display');
        expect(successHeading).toHaveClass('uppercase');
        expect(successHeading).toHaveClass('tracking-wide');
      });
    });

    it('should use industrial graphite text in success message', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const successMessage = screen.getByText(
          /if this email exists in our system/i
        );

        expect(successMessage).toHaveClass('text-industrial-graphite-500');
        expect(successMessage).not.toHaveClass('text-green-700');
      });
    });

    it('should style return link with orange (not green)', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const { container } = render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const returnLink = screen.getByRole('link', {
          name: /return to sign in/i,
        });

        expect(returnLink).toHaveClass('text-industrial-orange');
        // Verify no green colors in success state
        expect(
          container.querySelector('[class*="green"]')
        ).not.toBeInTheDocument();
      });
    });

    it('should use industrial card styling in success state', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const { container } = render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const card = container.querySelector('.bg-industrial-bg-card');
        expect(card).toBeInTheDocument();
        expect(card).toHaveClass('rounded-industrial-sharp');
        expect(card).toHaveClass('border-2');
      });
    });
  });

  describe('No Blue or Green Colors', () => {
    it('should not use any blue colors in form state', () => {
      const { container } = render(<ForgotPasswordPage />);

      // Check for absence of blue classes
      expect(
        container.querySelector('[class*="blue"]')
      ).not.toBeInTheDocument();
    });

    it('should not use any green colors in success state', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const { container } = render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        // Verify success state is visible
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();

        // Check for absence of green classes
        expect(
          container.querySelector('[class*="green"]')
        ).not.toBeInTheDocument();
      });
    });

    it('should not use gray background (should use cream)', () => {
      const { container } = render(<ForgotPasswordPage />);
      const mainDiv = container.firstChild as HTMLElement;

      expect(mainDiv).not.toHaveClass('bg-gray-50');
      expect(mainDiv).toHaveClass('bg-industrial-bg-primary');
    });
  });

  describe('Sharp Corners (No Rounded)', () => {
    it('should use sharp corners for card', () => {
      const { container } = render(<ForgotPasswordPage />);

      const card = container.querySelector('.rounded-industrial-sharp');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('border-2');
      expect(card).toHaveClass('border-industrial-graphite-200');
    });

    it('should use sharp corners for icon container in success state', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const { container } = render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const iconContainer = container.querySelector(
          '.bg-industrial-orange-100'
        );
        expect(iconContainer).toHaveClass('rounded-industrial-sharp');
      });
    });
  });

  describe('Security Features Maintained', () => {
    it('should maintain email enumeration prevention after design update', async () => {
      const user = userEvent.setup();
      mockedSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: {
          message: 'User not found',
          name: 'AuthApiError',
          status: 400,
        } as any,
      });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'nonexistent@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        // Should still show success message
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        // Should not show actual error
        expect(screen.queryByText(/user not found/i)).not.toBeInTheDocument();
      });
    });
  });
});
