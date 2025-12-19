/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClaimRequestForm } from '../ClaimRequestForm';
import * as emailVerification from '@/lib/utils/email-domain-verification';

global.fetch = jest.fn();

jest.mock('@/lib/utils/email-domain-verification', () => ({
  verifyEmailDomain: jest.fn(),
}));

const mockedVerifyEmailDomain =
  emailVerification.verifyEmailDomain as jest.MockedFunction<
    typeof emailVerification.verifyEmailDomain
  >;

describe('ClaimRequestForm', () => {
  const mockProps = {
    agencyId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
    agencyName: 'Test Staffing Agency',
    agencyWebsite: 'https://teststaffing.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockedVerifyEmailDomain.mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('should render the form with all fields', () => {
      render(<ClaimRequestForm {...mockProps} />);

      expect(screen.getByText('Claim Request Form')).toBeInTheDocument();
      expect(screen.getAllByText('Test Staffing Agency').length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/business email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/position.*title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/verification method/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/additional notes/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /submit claim request/i })
      ).toBeInTheDocument();
    });

    it('should display agency name as read-only', () => {
      render(<ClaimRequestForm {...mockProps} />);

      const agencyNameElements = screen.getAllByText('Test Staffing Agency');
      expect(agencyNameElements.length).toBeGreaterThan(0);
      // Check that none of the agency name elements are inputs
      agencyNameElements.forEach(element => {
        expect(element.tagName).not.toBe('INPUT');
      });
    });

    it('should show all three verification method options', () => {
      render(<ClaimRequestForm {...mockProps} />);

      expect(
        screen.getByLabelText(/email domain verification/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/phone verification/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/manual review/i)).toBeInTheDocument();
    });

    it('should mark required fields with asterisk', () => {
      render(<ClaimRequestForm {...mockProps} />);

      // Check that required fields have labels (without checking for asterisk in aria-label)
      expect(screen.getByLabelText(/business email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/position.*title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/verification method/i)).toBeInTheDocument();

      // Verify asterisks are present in the labels visually
      expect(screen.getAllByText('*').length).toBeGreaterThanOrEqual(4);
    });

    it('should show optional label for additional notes', () => {
      render(<ClaimRequestForm {...mockProps} />);

      expect(screen.getByText(/\(optional\)/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email address format/i)
        ).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid phone format', async () => {
      const user = userEvent.setup();
      render(<ClaimRequestForm {...mockProps} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      // Use an invalid phone number format (letters mixed with numbers)
      await user.type(phoneInput, 'abc-def-ghij');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid phone number format/i)
        ).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show validation error for empty position title', async () => {
      const user = userEvent.setup();
      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/position title must be at least/i)
        ).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should accept valid form data', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'claim-123',
            agency_id: mockProps.agencyId,
            user_id: 'user-123',
            status: 'pending',
            email_domain_verified: true,
            created_at: '2024-01-01T00:00:00Z',
          },
        }),
      });

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const positionInput = screen.getByLabelText(/position.*title/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'admin@teststaffing.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.type(positionInput, 'HR Manager');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/claims/request',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
    });
  });

  describe('Email Domain Warning', () => {
    it('should show warning when email domain does not match agency website', async () => {
      const user = userEvent.setup();
      mockedVerifyEmailDomain.mockReturnValue(false);

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);

      await user.type(emailInput, 'test@otherdomain.com');

      await waitFor(() => {
        expect(
          screen.getByText(/your email domain doesn't match/i)
        ).toBeInTheDocument();
      });
    });

    it('should not show warning when email domain matches agency website', async () => {
      const user = userEvent.setup();
      mockedVerifyEmailDomain.mockReturnValue(true);

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);

      await user.type(emailInput, 'admin@teststaffing.com');

      await waitFor(() => {
        expect(
          screen.queryByText(/your email domain doesn't match/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should not show warning when no agency website is provided', async () => {
      const user = userEvent.setup();

      render(<ClaimRequestForm {...mockProps} agencyWebsite={null} />);

      const emailInput = screen.getByLabelText(/business email/i);

      await user.type(emailInput, 'admin@anydomain.com');

      await waitFor(() => {
        expect(
          screen.queryByText(/your email domain doesn't match/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with all data', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'claim-123',
            agency_id: mockProps.agencyId,
            user_id: 'user-123',
            status: 'pending',
            email_domain_verified: true,
            created_at: '2024-01-01T00:00:00Z',
          },
        }),
      });

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const positionInput = screen.getByLabelText(/position.*title/i);
      const notesInput = screen.getByLabelText(/additional notes/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'admin@teststaffing.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.type(positionInput, 'HR Manager');
      await user.type(notesInput, 'I am the HR manager at this company');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/claims/request',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('admin@teststaffing.com'),
          })
        );
      });

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      );
      expect(callBody).toEqual({
        agency_id: mockProps.agencyId,
        business_email: 'admin@teststaffing.com',
        phone_number: '+1-555-123-4567',
        position_title: 'HR Manager',
        verification_method: 'email',
        additional_notes: 'I am the HR manager at this company',
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const positionInput = screen.getByLabelText(/position.*title/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'admin@teststaffing.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.type(positionInput, 'HR Manager');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/submitting\.\.\./i)).toBeInTheDocument();
      });
    });

    it('should disable form fields during submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const positionInput = screen.getByLabelText(/position.*title/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'admin@teststaffing.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.type(positionInput, 'HR Manager');
      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(phoneInput).toBeDisabled();
        expect(positionInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });

    it('should show success message after successful submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'claim-123',
            agency_id: mockProps.agencyId,
            user_id: 'user-123',
            status: 'pending',
            email_domain_verified: true,
            created_at: '2024-01-01T00:00:00Z',
          },
        }),
      });

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const positionInput = screen.getByLabelText(/position.*title/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'admin@teststaffing.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.type(positionInput, 'HR Manager');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/claim request submitted/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/claim-123/i)).toBeInTheDocument();
      });
    });

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'claim-123',
            agency_id: mockProps.agencyId,
            user_id: 'user-123',
            status: 'pending',
            email_domain_verified: true,
            created_at: '2024-01-01T00:00:00Z',
          },
        }),
      });

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(
        /business email/i
      ) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(
        /phone number/i
      ) as HTMLInputElement;
      const positionInput = screen.getByLabelText(
        /position.*title/i
      ) as HTMLInputElement;
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'admin@teststaffing.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.type(positionInput, 'HR Manager');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/claim request submitted/i)
        ).toBeInTheDocument();
      });

      expect(emailInput).toHaveValue('');
      expect(phoneInput).toHaveValue('');
      expect(positionInput).toHaveValue('');
    });
  });

  describe('Error Handling', () => {
    it('should show error message for already claimed agency', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            code: 'AGENCY_ALREADY_CLAIMED',
            message: 'This agency has already been claimed',
          },
        }),
      });

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const positionInput = screen.getByLabelText(/position.*title/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'admin@teststaffing.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.type(positionInput, 'HR Manager');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/already been claimed/i)).toBeInTheDocument();
      });
    });

    it('should show error message for pending claim exists', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            code: 'PENDING_CLAIM_EXISTS',
            message: 'You already have a pending claim',
          },
        }),
      });

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const positionInput = screen.getByLabelText(/position.*title/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'admin@teststaffing.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.type(positionInput, 'HR Manager');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/already have a pending claim/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error message for validation errors', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
          },
        }),
      });

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const positionInput = screen.getByLabelText(/position.*title/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'admin@teststaffing.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.type(positionInput, 'HR Manager');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/please check your form inputs/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error message for unauthorized requests', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        }),
      });

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const positionInput = screen.getByLabelText(/position.*title/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'admin@teststaffing.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.type(positionInput, 'HR Manager');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be logged in/i)).toBeInTheDocument();
      });
    });

    it('should show generic error message for unknown errors', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            code: 'UNKNOWN_ERROR',
            message: 'Something went wrong',
          },
        }),
      });

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const positionInput = screen.getByLabelText(/position.*title/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'admin@teststaffing.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.type(positionInput, 'HR Manager');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/something went wrong/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const positionInput = screen.getByLabelText(/position.*title/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'admin@teststaffing.com');
      await user.type(phoneInput, '+1-555-123-4567');
      await user.type(positionInput, 'HR Manager');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/an unexpected error occurred/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on all inputs', () => {
      render(<ClaimRequestForm {...mockProps} />);

      expect(screen.getByLabelText(/business email/i)).toHaveAttribute(
        'aria-label',
        'Business email'
      );
      expect(screen.getByLabelText(/phone number/i)).toHaveAttribute(
        'aria-label',
        'Phone number'
      );
      expect(screen.getByLabelText(/position.*title/i)).toHaveAttribute(
        'aria-label',
        'Position or title'
      );
      expect(screen.getByLabelText(/additional notes/i)).toHaveAttribute(
        'aria-label',
        'Additional notes'
      );
    });

    it('should link error messages with aria-describedby', async () => {
      const user = userEvent.setup();
      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'invalid');
      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute(
          'aria-describedby',
          'business-email-error'
        );
      });
    });

    it('should mark invalid fields with aria-invalid', async () => {
      const user = userEvent.setup();
      render(<ClaimRequestForm {...mockProps} />);

      const emailInput = screen.getByLabelText(/business email/i);
      const submitButton = screen.getByRole('button', {
        name: /submit claim request/i,
      });

      await user.type(emailInput, 'invalid');
      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });
});
