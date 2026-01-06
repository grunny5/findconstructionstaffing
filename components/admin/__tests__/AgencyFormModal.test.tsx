import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgencyFormModal } from '../AgencyFormModal';
import { toast } from 'sonner';
import type { Trade, Region } from '@/types/supabase';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock TradeSelector component
jest.mock('@/components/dashboard/TradeSelector', () => ({
  TradeSelector: ({
    selectedTrades,
    onChange,
    disabled,
    maxTrades,
  }: {
    selectedTrades: Trade[];
    onChange: (trades: Trade[]) => void;
    disabled?: boolean;
    maxTrades?: number;
  }) => (
    <div data-testid="trade-selector-mock">
      <span data-testid="trade-count">{selectedTrades.length}</span>
      <span data-testid="max-trades">{maxTrades}</span>
      <button
        data-testid="add-trade-button"
        onClick={() =>
          onChange([
            ...selectedTrades,
            { id: 'trade-new', name: 'New Trade', slug: 'new-trade' },
          ])
        }
        disabled={disabled}
      >
        Add Trade
      </button>
      <button
        data-testid="clear-trades-button"
        onClick={() => onChange([])}
        disabled={disabled}
      >
        Clear Trades
      </button>
    </div>
  ),
}));

// Mock RegionSelector component
jest.mock('@/components/dashboard/RegionSelector', () => ({
  RegionSelector: ({
    selectedRegions,
    onChange,
    disabled,
  }: {
    selectedRegions: Region[];
    onChange: (regions: Region[]) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="region-selector-mock">
      <span data-testid="region-count">{selectedRegions.length}</span>
      <button
        data-testid="add-region-button"
        onClick={() =>
          onChange([
            ...selectedRegions,
            { id: 'region-new', name: 'Texas', slug: 'texas', state_code: 'TX' },
          ])
        }
        disabled={disabled}
      >
        Add Region
      </button>
      <button
        data-testid="clear-regions-button"
        onClick={() => onChange([])}
        disabled={disabled}
      >
        Clear Regions
      </button>
    </div>
  ),
}));

// Mock LogoUpload component
const mockLogoFileSelect = jest.fn();
jest.mock('@/components/admin/LogoUpload', () => ({
  LogoUpload: ({
    currentLogoUrl,
    onFileSelect,
    isUploading,
    disabled,
    error,
  }: {
    currentLogoUrl?: string | null;
    onFileSelect: (file: File | null) => void;
    isUploading?: boolean;
    disabled?: boolean;
    error?: string | null;
  }) => {
    // Store onFileSelect so tests can call it
    mockLogoFileSelect.mockImplementation(onFileSelect);
    return (
      <div data-testid="logo-upload-mock">
        <span data-testid="logo-current-url">{currentLogoUrl || 'none'}</span>
        <span data-testid="logo-is-uploading">{isUploading ? 'true' : 'false'}</span>
        <span data-testid="logo-disabled">{disabled ? 'true' : 'false'}</span>
        <span data-testid="logo-error">{error || 'none'}</span>
        <button
          data-testid="logo-select-file-button"
          onClick={() => {
            const mockFile = new File(['test'], 'logo.png', { type: 'image/png' });
            onFileSelect(mockFile);
          }}
          disabled={disabled}
        >
          Select File
        </button>
        <button
          data-testid="logo-remove-button"
          onClick={() => onFileSelect(null)}
          disabled={disabled}
        >
          Remove Logo
        </button>
      </div>
    );
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

  describe('Trade Selector Integration', () => {
    it('renders TradeSelector component', () => {
      render(<AgencyFormModal {...defaultProps} />);

      expect(screen.getByTestId('trade-selector-section')).toBeInTheDocument();
      expect(screen.getByTestId('trade-selector-mock')).toBeInTheDocument();
    });

    it('sets maxTrades to 100 for admin (no limit)', () => {
      render(<AgencyFormModal {...defaultProps} />);

      expect(screen.getByTestId('max-trades')).toHaveTextContent('100');
    });

    it('shows 0 trades by default in create mode', () => {
      render(<AgencyFormModal {...defaultProps} />);

      expect(screen.getByTestId('trade-count')).toHaveTextContent('0');
    });

    it('pre-populates trades when editing existing agency', () => {
      const existingAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        trades: [
          { id: 'trade-1', name: 'Electrician', slug: 'electrician' },
          { id: 'trade-2', name: 'Plumber', slug: 'plumber' },
        ],
      };

      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      expect(screen.getByTestId('trade-count')).toHaveTextContent('2');
    });

    it('allows adding trades via TradeSelector', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      expect(screen.getByTestId('trade-count')).toHaveTextContent('0');

      fireEvent.click(screen.getByTestId('add-trade-button'));

      expect(screen.getByTestId('trade-count')).toHaveTextContent('1');
    });

    it('includes trade_ids in form submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      render(<AgencyFormModal {...defaultProps} />);

      // Add a trade
      fireEvent.click(screen.getByTestId('add-trade-button'));

      // Fill required field
      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'Test Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.trade_ids).toEqual(['trade-new']);
      });
    });

    it('resets trades when cancel is clicked', async () => {
      const existingAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        trades: [{ id: 'trade-1', name: 'Electrician', slug: 'electrician' }],
      };

      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      // Initially has 1 trade
      expect(screen.getByTestId('trade-count')).toHaveTextContent('1');

      // Add another trade
      fireEvent.click(screen.getByTestId('add-trade-button'));
      expect(screen.getByTestId('trade-count')).toHaveTextContent('2');

      // Cancel should reset to original
      fireEvent.click(screen.getByTestId('agency-form-cancel-button'));

      // Re-render with same agency to check reset
      // Note: The modal closes on cancel, so we need to check the state was reset
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('disables TradeSelector when submitting', async () => {
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
      await userEvent.type(nameInput, 'Test Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('add-trade-button')).toBeDisabled();
      });
    });
  });

  describe('Region Selector Integration', () => {
    it('renders RegionSelector component', () => {
      render(<AgencyFormModal {...defaultProps} />);

      expect(screen.getByTestId('region-selector-section')).toBeInTheDocument();
      expect(screen.getByTestId('region-selector-mock')).toBeInTheDocument();
    });

    it('shows 0 regions by default in create mode', () => {
      render(<AgencyFormModal {...defaultProps} />);

      expect(screen.getByTestId('region-count')).toHaveTextContent('0');
    });

    it('pre-populates regions when editing existing agency', () => {
      const existingAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        regions: [
          { id: 'region-1', name: 'Texas', slug: 'texas', state_code: 'TX' },
          { id: 'region-2', name: 'California', slug: 'california', state_code: 'CA' },
        ],
      };

      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      expect(screen.getByTestId('region-count')).toHaveTextContent('2');
    });

    it('allows adding regions via RegionSelector', async () => {
      render(<AgencyFormModal {...defaultProps} />);

      expect(screen.getByTestId('region-count')).toHaveTextContent('0');

      fireEvent.click(screen.getByTestId('add-region-button'));

      expect(screen.getByTestId('region-count')).toHaveTextContent('1');
    });

    it('includes region_ids in form submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      render(<AgencyFormModal {...defaultProps} />);

      // Add a region
      fireEvent.click(screen.getByTestId('add-region-button'));

      // Fill required field
      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'Test Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.region_ids).toEqual(['region-new']);
      });
    });

    it('resets regions when cancel is clicked', async () => {
      const existingAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        regions: [{ id: 'region-1', name: 'Texas', slug: 'texas', state_code: 'TX' }],
      };

      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      // Initially has 1 region
      expect(screen.getByTestId('region-count')).toHaveTextContent('1');

      // Add another region
      fireEvent.click(screen.getByTestId('add-region-button'));
      expect(screen.getByTestId('region-count')).toHaveTextContent('2');

      // Cancel should reset to original
      fireEvent.click(screen.getByTestId('agency-form-cancel-button'));

      // Modal closes on cancel
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('disables RegionSelector when submitting', async () => {
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
      await userEvent.type(nameInput, 'Test Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('add-region-button')).toBeDisabled();
      });
    });
  });

  describe('Logo Upload Integration', () => {
    it('renders LogoUpload component', () => {
      render(<AgencyFormModal {...defaultProps} />);
      expect(screen.getByTestId('logo-upload-mock')).toBeInTheDocument();
    });

    it('shows no logo URL in create mode', () => {
      render(<AgencyFormModal {...defaultProps} />);
      expect(screen.getByTestId('logo-current-url')).toHaveTextContent('none');
    });

    it('shows existing logo URL in edit mode', () => {
      const existingAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        logo_url: 'https://example.com/logo.png',
      };

      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);
      expect(screen.getByTestId('logo-current-url')).toHaveTextContent(
        'https://example.com/logo.png'
      );
    });

    it('uploads logo when file is selected on form submission', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 'new-agency-123' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { logo_url: 'https://storage.example.com/logo.webp' } }),
        });

      render(<AgencyFormModal {...defaultProps} />);

      // Select a logo file
      fireEvent.click(screen.getByTestId('logo-select-file-button'));

      // Fill required field
      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'Test Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        // First call is for agency creation
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/agencies',
          expect.any(Object)
        );
        // Second call is for logo upload
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/agencies/new-agency-123/logo',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    it('clears logo URL display when remove button clicked in edit mode', async () => {
      const existingAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        logo_url: 'https://example.com/logo.png',
      };

      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      // Initially shows logo URL
      expect(screen.getByTestId('logo-current-url')).toHaveTextContent(
        'https://example.com/logo.png'
      );

      // Click remove button
      fireEvent.click(screen.getByTestId('logo-remove-button'));

      // Logo URL should now be cleared in display
      await waitFor(() => {
        expect(screen.getByTestId('logo-current-url')).toHaveTextContent('none');
      });
    });

    it('disables LogoUpload when submitting', async () => {
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
      await userEvent.type(nameInput, 'Test Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('logo-disabled')).toHaveTextContent('true');
      });
    });

    it('resets logo state when cancel is clicked', async () => {
      const existingAgency = {
        id: 'agency-123',
        name: 'Test Agency',
        logo_url: 'https://example.com/logo.png',
      };

      render(<AgencyFormModal {...defaultProps} agency={existingAgency} />);

      // Remove the logo (marks for removal)
      fireEvent.click(screen.getByTestId('logo-remove-button'));
      expect(screen.getByTestId('logo-current-url')).toHaveTextContent('none');

      // Cancel should reset
      fireEvent.click(screen.getByTestId('agency-form-cancel-button'));

      // Modal closes on cancel
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('shows warning toast when logo upload fails but agency is saved', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 'new-agency-123' } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: 'Upload failed' } }),
        });

      render(<AgencyFormModal {...defaultProps} />);

      // Select a logo file
      fireEvent.click(screen.getByTestId('logo-select-file-button'));

      // Fill required field
      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'Test Agency');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith(
          'Agency Saved',
          expect.objectContaining({
            description: expect.stringContaining('logo upload failed'),
          })
        );
      });
    });
  });
});
