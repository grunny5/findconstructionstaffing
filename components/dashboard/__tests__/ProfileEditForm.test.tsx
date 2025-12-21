import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileEditForm } from '../ProfileEditForm';
import type { AgencyProfileFormData } from '@/lib/validations/agency-profile';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/dashboard'),
}));

describe('ProfileEditForm', () => {
  const mockOnSubmit = jest.fn<Promise<void>, [AgencyProfileFormData]>();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  const mockInitialData: Partial<AgencyProfileFormData> = {
    name: 'Test Staffing Agency',
    description: '<p>A professional staffing agency.</p>',
    website: 'https://www.example.com',
    phone: '+12345678900',
    email: 'contact@example.com',
    founded_year: '2000',
    employee_count: '50-100',
    headquarters: 'Houston, TX',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<ProfileEditForm {...defaultProps} />);

      expect(
        screen.getByLabelText(/company name/i, { exact: false })
      ).toBeInTheDocument();
      expect(screen.getByText(/company description/i)).toBeInTheDocument();
      expect(screen.getByTestId('description-editor')).toBeInTheDocument();
      expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/founded year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/employee count/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/headquarters location/i)
      ).toBeInTheDocument();
    });

    it('should render form action buttons', () => {
      render(<ProfileEditForm {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /save changes/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('should load form with initial data', () => {
      render(
        <ProfileEditForm {...defaultProps} initialData={mockInitialData} />
      );

      expect(
        screen.getByDisplayValue('Test Staffing Agency')
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('https://www.example.com')
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('+12345678900')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('contact@example.com')
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('Houston, TX')).toBeInTheDocument();
    });

    it('should display "Save Changes" button as disabled when form is pristine', () => {
      render(
        <ProfileEditForm {...defaultProps} initialData={mockInitialData} />
      );

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Rich Text Editor', () => {
    it('should render TipTap editor toolbar', () => {
      render(<ProfileEditForm {...defaultProps} />);

      // Check for toolbar buttons (using aria-labels or visible icons)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(5); // Bold, Italic, Lists, Link, etc.
    });

    it('should display character counter for description', () => {
      render(<ProfileEditForm {...defaultProps} />);

      expect(screen.getByText(/\/ 2000 characters/i)).toBeInTheDocument();
    });

    it('should update character counter when description changes', async () => {
      const user = userEvent.setup();
      render(<ProfileEditForm {...defaultProps} />);

      // TipTap editor is rendered as contenteditable div within the description-editor container
      const editorContainer = screen.getByTestId('description-editor');
      const editor = editorContainer.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;

      expect(editor).toBeInTheDocument();

      // Type in the editor
      await user.click(editor);
      await user.keyboard('Test description');

      await waitFor(() => {
        expect(screen.getByText(/16 \/ 2000 characters/i)).toBeInTheDocument();
      });
    });

    it('should show warning when description exceeds 2000 characters', async () => {
      const longDescription = 'a'.repeat(2001);
      render(
        <ProfileEditForm
          {...defaultProps}
          initialData={{ description: `<p>${longDescription}</p>` }}
        />
      );

      await waitFor(() => {
        const counter = screen.getByText(/2001 \/ 2000 characters/i);
        expect(counter).toHaveClass('text-destructive');
      });
    });
  });

  describe('Validation', () => {
    it('should validate company name minimum length', async () => {
      const user = userEvent.setup();
      render(<ProfileEditForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/company name/i, {
        exact: false,
      });
      await user.type(nameInput, 'A');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/company name must be at least 2 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate website URL format', async () => {
      const user = userEvent.setup();
      render(<ProfileEditForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website url/i);
      await user.type(websiteInput, 'invalid-url');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/must be a valid url/i)).toBeInTheDocument();
      });
    });

    it('should validate phone number E.164 format', async () => {
      const user = userEvent.setup();
      render(<ProfileEditForm {...defaultProps} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '0123'); // Starts with 0, which is invalid for E.164
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/phone must be in e.164 format/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<ProfileEditForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/must be a valid email address/i)
        ).toBeInTheDocument();
      });
    });

    it('should accept valid form data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce();

      render(<ProfileEditForm {...defaultProps} />);

      // Fill out form with valid data
      await user.type(
        screen.getByLabelText(/company name/i, { exact: false }),
        'Valid Company Name'
      );
      await user.type(
        screen.getByLabelText(/website url/i),
        'https://www.example.com'
      );
      await user.type(screen.getByLabelText(/phone number/i), '+12345678900');
      await user.type(
        screen.getByLabelText(/email address/i),
        'contact@example.com'
      );

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeEnabled();

      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Valid Company Name',
            website: 'https://www.example.com',
            phone: '+12345678900',
            email: 'contact@example.com',
          })
        );
      });
    });
  });

  describe('Admin Approval Warning', () => {
    it('should show warning when company name changes', async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditForm {...defaultProps} initialData={mockInitialData} />
      );

      const nameInput = screen.getByDisplayValue('Test Staffing Agency');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Company Name');

      await waitFor(() => {
        expect(
          screen.getByText(/changing the company name requires admin approval/i)
        ).toBeInTheDocument();
      });
    });

    it('should NOT show warning when name is unchanged', async () => {
      render(
        <ProfileEditForm {...defaultProps} initialData={mockInitialData} />
      );

      expect(
        screen.queryByText(/changing the company name requires admin approval/i)
      ).not.toBeInTheDocument();
    });

    it('should NOT show warning when only whitespace/case changes', async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditForm {...defaultProps} initialData={mockInitialData} />
      );

      const nameInput = screen.getByDisplayValue('Test Staffing Agency');
      await user.clear(nameInput);
      await user.type(nameInput, 'test staffing agency'); // Same but lowercase

      await waitFor(() => {
        expect(
          screen.queryByText(
            /changing the company name requires admin approval/i
          )
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Actions', () => {
    it('should enable Save button when form has changes', async () => {
      const user = userEvent.setup();
      render(
        <ProfileEditForm {...defaultProps} initialData={mockInitialData} />
      );

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();

      const nameInput = screen.getByDisplayValue('Test Staffing Agency');
      await user.type(nameInput, ' Updated');

      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProfileEditForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should reset form when cancel is clicked', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <ProfileEditForm {...defaultProps} initialData={mockInitialData} />
      );

      const nameInput = screen.getByDisplayValue('Test Staffing Agency');
      await user.type(nameInput, ' Updated');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      await waitFor(() => {
        expect(
          screen.getByDisplayValue('Test Staffing Agency')
        ).toBeInTheDocument();
      });

      confirmSpy.mockRestore();
    });

    it('should call onSubmit with form data when submitted', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce();

      render(
        <ProfileEditForm {...defaultProps} initialData={mockInitialData} />
      );

      const nameInput = screen.getByDisplayValue('Test Staffing Agency');
      await user.type(nameInput, ' LLC');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Staffing Agency LLC',
          })
        );
      });
    });

    it('should disable buttons while submitting', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValueOnce(submitPromise);

      render(
        <ProfileEditForm {...defaultProps} initialData={mockInitialData} />
      );

      const nameInput = screen.getByDisplayValue('Test Staffing Agency');
      await user.type(nameInput, ' Updated');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      await user.click(saveButton);

      // Check that buttons are disabled and loading spinner is shown
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
        expect(saveButton).toHaveTextContent(/save changes/i);
      });

      // Check that loading spinner is visible (implicit in the button being disabled)
      const loadingSpinner = saveButton.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();

      resolveSubmit!();

      // After submission, loading spinner should disappear
      await waitFor(
        () => {
          const spinner = saveButton.querySelector('.animate-spin');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Note: Save button remains disabled after submission because form is no longer dirty
      // Cancel button should be enabled again
      expect(cancelButton).toBeEnabled();
    });
  });

  describe('Dropdowns', () => {
    it('should render founded year dropdown', () => {
      render(<ProfileEditForm {...defaultProps} />);

      const yearSelect = screen.getByLabelText(/founded year/i);
      expect(yearSelect).toBeInTheDocument();
      expect(yearSelect).toHaveAttribute('role', 'combobox');
    });

    it('should render employee count dropdown', () => {
      render(<ProfileEditForm {...defaultProps} />);

      const employeeSelect = screen.getByLabelText(/employee count/i);
      expect(employeeSelect).toBeInTheDocument();
      expect(employeeSelect).toHaveAttribute('role', 'combobox');
    });

    it('should load dropdown with initial values', () => {
      render(
        <ProfileEditForm
          {...defaultProps}
          initialData={{
            ...mockInitialData,
            founded_year: '2000',
            employee_count: '50-100',
          }}
        />
      );

      const yearSelect = screen.getByLabelText(/founded year/i);
      const employeeSelect = screen.getByLabelText(/employee count/i);

      expect(yearSelect).toHaveTextContent('2000');
      expect(employeeSelect).toHaveTextContent('50-100 employees');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<ProfileEditForm {...defaultProps} />);

      expect(
        screen.getByLabelText(/company name/i, { exact: false })
      ).toBeInTheDocument();
      expect(screen.getByText(/company description/i)).toBeInTheDocument();
      expect(screen.getByTestId('description-editor')).toBeInTheDocument();
      expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/founded year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/employee count/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/headquarters location/i)
      ).toBeInTheDocument();
    });

    it('should show required indicator for company name', () => {
      render(<ProfileEditForm {...defaultProps} />);

      const nameLabel = screen.getByText(/company name/i);
      expect(nameLabel.parentElement).toHaveTextContent('*');
    });

    it('should have descriptive helper text for fields', () => {
      render(<ProfileEditForm {...defaultProps} />);

      expect(screen.getByText(/your company website/i)).toBeInTheDocument();
      expect(screen.getByText(/e.164 format/i)).toBeInTheDocument();
      expect(screen.getByText(/primary contact email/i)).toBeInTheDocument();
    });
  });
});
