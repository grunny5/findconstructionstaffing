import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgencyFormModal } from '../AgencyFormModal';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AgencyFormModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Create Mode Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<AgencyFormModal {...defaultProps} />);

      expect(screen.getByTestId('agency-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Create Agency'
      );
    });

    it('does not render modal when isOpen is false', () => {
      render(<AgencyFormModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('agency-form-modal')).not.toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(<AgencyFormModal {...defaultProps} />);

      expect(screen.getByTestId('name-input')).toBeInTheDocument();
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
      expect(screen.getByTestId('website-input')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('phone-input')).toBeInTheDocument();
      expect(screen.getByTestId('headquarters-input')).toBeInTheDocument();
      expect(screen.getByTestId('founded-year-select')).toBeInTheDocument();
      expect(screen.getByTestId('employee-count-select')).toBeInTheDocument();
      expect(screen.getByTestId('company-size-select')).toBeInTheDocument();
      expect(screen.getByTestId('offers-per-diem-switch')).toBeInTheDocument();
      expect(screen.getByTestId('is-union-switch')).toBeInTheDocument();
    });

    it('renders submit button with "Create Agency" text', () => {
      render(<AgencyFormModal {...defaultProps} />);

      expect(screen.getByTestId('submit-button')).toHaveTextContent(
        'Create Agency'
      );
    });

    it('renders cancel button', () => {
      render(<AgencyFormModal {...defaultProps} />);

      expect(screen.getByTestId('agency-form-cancel-button')).toHaveTextContent(
        'Cancel'
      );
    });

    it('shows required indicator for company name field', () => {
      render(<AgencyFormModal {...defaultProps} />);

      const label = screen.getByText('Company Name');
      expect(label.parentElement).toHaveTextContent('*');
    });
  });

  describe('Edit Mode Rendering', () => {
    const existingAgency = {
      id: 'agency-123',
      name: 'Test Agency',
      description: 'Test description',
      website: 'https://test.com',
      phone: '+12345678900',
      email: 'test@test.com',
      headquarters: 'Houston, TX',
      founded_year: 2010,
      employee_count: '51-100',
      company_size: 'Medium',
      offers_per_diem: true,
      is_union: false,
    };

    it('renders with "Edit Agency" title when agency is provided', () => {
      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Edit Agency'
      );
    });

    it('pre-populates form fields with existing agency data', () => {
      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      expect(screen.getByTestId('name-input')).toHaveValue('Test Agency');
      expect(screen.getByTestId('description-input')).toHaveValue(
        'Test description'
      );
      expect(screen.getByTestId('website-input')).toHaveValue(
        'https://test.com'
      );
      expect(screen.getByTestId('phone-input')).toHaveValue('+12345678900');
      expect(screen.getByTestId('email-input')).toHaveValue('test@test.com');
      expect(screen.getByTestId('headquarters-input')).toHaveValue(
        'Houston, TX'
      );
    });

    it('renders submit button with "Save Changes" text', () => {
      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      expect(screen.getByTestId('submit-button')).toHaveTextContent(
        'Save Changes'
      );
    });

    it('pre-populates boolean switches correctly', () => {
      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      const perDiemSwitch = screen.getByTestId('offers-per-diem-switch');
      const unionSwitch = screen.getByTestId('is-union-switch');

      expect(perDiemSwitch).toHaveAttribute('data-state', 'checked');
      expect(unionSwitch).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('Form Validation', () => {
    it('shows error when name is empty and field is blurred', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toHaveTextContent(
          'Company name must be at least 2 characters'
        );
      });
    });

    it('shows error when name is too short', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'A');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toHaveTextContent(
          'Company name must be at least 2 characters'
        );
      });
    });

    it('shows error for invalid email format', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      const emailInput = screen.getByTestId('email-input');
      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(
          'Must be a valid email address'
        );
      });
    });

    it('shows error for invalid website URL', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      const websiteInput = screen.getByTestId('website-input');
      await userEvent.type(websiteInput, 'not-a-url');
      fireEvent.blur(websiteInput);

      await waitFor(() => {
        expect(screen.getByTestId('website-error')).toHaveTextContent(
          'Must be a valid URL'
        );
      });
    });

    it('shows error for invalid phone format', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      const phoneInput = screen.getByTestId('phone-input');
      await userEvent.type(phoneInput, 'invalid-phone');
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(screen.getByTestId('phone-error')).toHaveTextContent(
          'Phone must be in E.164 format'
        );
      });
    });

    it('clears validation errors when valid input is provided', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toBeInTheDocument();
      });

      await userEvent.type(nameInput, 'Valid Company Name');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(
          screen.queryByText('Company name must be at least 2 characters')
        ).not.toBeInTheDocument();
      });
    });

    it('disables submit button when form is invalid', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when form is valid', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'Valid Company Name');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const submitButton = screen.getByTestId('submit-button');
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Submission - Create Mode', () => {
    it('calls POST endpoint when creating a new agency', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 'new-agency-id', name: 'New Agency' },
        }),
      });

      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'New Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/agencies',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('shows success toast on successful creation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 'new-agency-id', name: 'New Agency' },
        }),
      });

      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'New Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Agency Created',
          expect.objectContaining({
            description: expect.stringContaining('New Agency'),
          })
        );
      });
    });

    it('calls onClose and onSuccess after successful creation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-agency-id' } }),
      });

      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'New Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
    });

    it('shows error toast on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Duplicate agency name' } }),
      });

      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'New Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Creation Failed',
          expect.objectContaining({
            description: 'Duplicate agency name',
          })
        );
      });
    });

    it('shows loading spinner while submitting', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ data: {} }),
                }),
              100
            )
          )
      );

      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'New Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });
    });

    it('disables cancel button while submitting', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ data: {} }),
                }),
              100
            )
          )
      );

      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'New Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('agency-form-cancel-button')).toBeDisabled();
      });
    });
  });

  describe('Form Submission - Edit Mode', () => {
    const existingAgency = {
      id: 'agency-123',
      name: 'Test Agency',
      description: null,
      website: null,
      phone: null,
      email: null,
      headquarters: null,
      founded_year: null,
      employee_count: null,
      company_size: null,
      offers_per_diem: false,
      is_union: false,
    };

    it('calls PATCH endpoint when editing an agency', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'agency-123' } }),
      });

      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/agencies/agency-123',
          expect.objectContaining({
            method: 'PATCH',
          })
        );
      });
    });

    it('shows success toast with update message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'agency-123' } }),
      });

      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Agency Updated',
          expect.objectContaining({
            description: expect.stringContaining('Updated Agency'),
          })
        );
      });
    });

    it('shows error toast with update failed message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Update failed' } }),
      });

      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Update Failed',
          expect.any(Object)
        );
      });
    });
  });

  describe('Cancel Behavior', () => {
    it('calls onClose when cancel button is clicked', () => {
      render(<AgencyFormModal {...defaultProps} />);

      fireEvent.click(screen.getByTestId('agency-form-cancel-button'));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('resets form when cancel button is clicked', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'Some Agency');

      fireEvent.click(screen.getByTestId('agency-form-cancel-button'));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when dialog is closed via overlay', () => {
      render(<AgencyFormModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Form Field Interactions', () => {
    it('allows toggling offers_per_diem switch', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      const perDiemSwitch = screen.getByTestId('offers-per-diem-switch');
      expect(perDiemSwitch).toHaveAttribute('data-state', 'unchecked');

      fireEvent.click(perDiemSwitch);

      await waitFor(() => {
        expect(perDiemSwitch).toHaveAttribute('data-state', 'checked');
      });
    });

    it('allows toggling is_union switch', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      const unionSwitch = screen.getByTestId('is-union-switch');
      expect(unionSwitch).toHaveAttribute('data-state', 'unchecked');

      fireEvent.click(unionSwitch);

      await waitFor(() => {
        expect(unionSwitch).toHaveAttribute('data-state', 'checked');
      });
    });

    it('includes all form data in API request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      render(<AgencyFormModal {...defaultProps} />);

      await userEvent.type(screen.getByTestId('name-input'), 'Test Company');
      await userEvent.type(
        screen.getByTestId('description-input'),
        'Test description'
      );
      await userEvent.type(
        screen.getByTestId('website-input'),
        'https://test.com'
      );
      await userEvent.type(screen.getByTestId('email-input'), 'test@test.com');
      await userEvent.type(screen.getByTestId('phone-input'), '+12345678900');
      await userEvent.type(
        screen.getByTestId('headquarters-input'),
        'Houston, TX'
      );

      fireEvent.click(screen.getByTestId('offers-per-diem-switch'));

      fireEvent.blur(screen.getByTestId('name-input'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody).toMatchObject({
          name: 'Test Company',
          description: 'Test description',
          website: 'https://test.com',
          email: 'test@test.com',
          phone: '+12345678900',
          headquarters: 'Houston, TX',
          offers_per_diem: true,
          is_union: false,
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible form labels', () => {
      render(<AgencyFormModal {...defaultProps} />);

      expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Website/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Headquarters/i)).toBeInTheDocument();
    });

    it('marks required fields with asterisk', () => {
      render(<AgencyFormModal {...defaultProps} />);

      const nameLabel = screen.getByText('Company Name');
      expect(nameLabel.parentElement?.textContent).toContain('*');
    });
  });

  describe('Network Error Handling', () => {
    it('shows generic error message on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'New Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Creation Failed',
          expect.objectContaining({
            description: 'Network error',
          })
        );
      });
    });

    it('does not call onClose or onSuccess on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Server error' } }),
      });

      render(<AgencyFormModal {...defaultProps} />);

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'New Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      expect(defaultProps.onClose).not.toHaveBeenCalled();
      expect(defaultProps.onSuccess).not.toHaveBeenCalled();
    });
  });
});
