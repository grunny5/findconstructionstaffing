import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserFormModal } from '../UserFormModal';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedToast = jest.mocked(toast);

describe('UserFormModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========================================================================
  // RENDERING TESTS
  // ========================================================================

  describe('Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Create User'
      );
    });

    it('does not render modal when isOpen is false', () => {
      render(
        <UserFormModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByTestId('user-form-modal')).not.toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('full-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('role-select')).toBeInTheDocument();
    });

    it('renders cancel and submit buttons', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('shows "Create User" title and button text in create mode', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Create User'
      );
      expect(screen.getByTestId('submit-button')).toHaveTextContent(
        'Create User'
      );
    });

    it('shows "Edit User" title and button text in edit mode', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          user={{
            id: 'user-123',
            email: 'test@example.com',
            full_name: 'Test User',
            role: 'user',
          }}
        />
      );

      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit User');
      expect(screen.getByTestId('submit-button')).toHaveTextContent(
        'Save Changes'
      );
    });
  });

  // ========================================================================
  // CREATE MODE TESTS
  // ========================================================================

  describe('Create Mode', () => {
    it('pre-fills form with default values', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByTestId('email-input')).toHaveValue('');
      expect(screen.getByTestId('full-name-input')).toHaveValue('');
      expect(screen.getByTestId('role-select')).toHaveTextContent('User');
    });

    it('enables email field in create mode', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByTestId('email-input')).not.toBeDisabled();
    });

    it('submits create request with correct data', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'User created successfully',
            user: {
              id: 'new-user-123',
              email: 'newuser@example.com',
              full_name: 'New User',
              role: 'user',
            },
            passwordResetSent: true,
          }),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'newuser@example.com');
      await user.type(screen.getByTestId('full-name-input'), 'New User');

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'newuser@example.com',
              full_name: 'New User',
              role: 'user',
            }),
          })
        );
      });
    });

    it('shows success toast after successful creation', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'User created successfully',
            user: {
              id: 'new-user-123',
              email: 'newuser@example.com',
              full_name: null,
              role: 'user',
            },
            passwordResetSent: true,
          }),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'newuser@example.com');
      await user.tab(); // Trigger blur for validation

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockedToast.success).toHaveBeenCalledWith(
          'User Created',
          expect.objectContaining({
            description: expect.stringContaining('newuser@example.com'),
          })
        );
      });
    });

    it('shows password reset message in success toast when email sent', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'User created successfully',
            user: { id: 'new-user-123', email: 'newuser@example.com' },
            passwordResetSent: true,
          }),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'newuser@example.com');
      await user.tab(); // Trigger blur for validation

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockedToast.success).toHaveBeenCalledWith(
          'User Created',
          expect.objectContaining({
            description: expect.stringContaining('password reset email'),
          })
        );
      });
    });

    it('calls onClose and onSuccess after successful creation', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'User created successfully',
            user: { id: 'new-user-123', email: 'newuser@example.com' },
            passwordResetSent: true,
          }),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'newuser@example.com');
      await user.tab(); // Trigger blur for validation

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  // ========================================================================
  // EDIT MODE TESTS
  // ========================================================================

  describe('Edit Mode', () => {
    const existingUser = {
      id: 'user-123',
      email: 'existing@example.com',
      full_name: 'Existing User',
      role: 'agency_owner' as const,
    };

    it('pre-fills form with user data', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          user={existingUser}
        />
      );

      expect(screen.getByTestId('email-input')).toHaveValue(
        'existing@example.com'
      );
      expect(screen.getByTestId('full-name-input')).toHaveValue(
        'Existing User'
      );
      expect(screen.getByTestId('role-select')).toHaveTextContent(
        'Agency Owner'
      );
    });

    it('disables email field in edit mode', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          user={existingUser}
        />
      );

      expect(screen.getByTestId('email-input')).toBeDisabled();
    });

    it('shows email cannot be changed message in edit mode', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          user={existingUser}
        />
      );

      expect(screen.getByText(/email cannot be changed/i)).toBeInTheDocument();
    });

    it('submits PATCH request with correct data', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'User updated successfully',
            user: { ...existingUser, full_name: 'Updated Name' },
          }),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          user={existingUser}
        />
      );

      const nameInput = screen.getByTestId('full-name-input');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/user-123',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('shows success toast after successful update', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'User updated successfully',
            user: existingUser,
          }),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          user={existingUser}
        />
      );

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockedToast.success).toHaveBeenCalledWith(
          'User Updated',
          expect.objectContaining({
            description: expect.stringContaining('existing@example.com'),
          })
        );
      });
    });
  });

  // ========================================================================
  // VALIDATION TESTS
  // ========================================================================

  describe('Validation', () => {
    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(
          'Must be a valid email address'
        );
      });
    });

    it('shows error for name exceeding 200 characters', async () => {
      const user = userEvent.setup();

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nameInput = screen.getByTestId('full-name-input');
      await user.type(nameInput, 'a'.repeat(201));
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByTestId('full-name-error')).toHaveTextContent(
          'Name must be less than 200 characters'
        );
      });
    });

    it('disables submit button when form is invalid', async () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Submit button should be disabled with empty required fields
      expect(screen.getByTestId('submit-button')).toBeDisabled();
    });

    it('enables submit button when form is valid', async () => {
      const user = userEvent.setup();

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'valid@example.com');
      await user.tab(); // Trigger blur for validation

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });
    });
  });

  // ========================================================================
  // ROLE SELECTION TESTS
  // ========================================================================

  describe('Role Selection', () => {
    it('defaults to user role', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByTestId('role-select')).toHaveTextContent('User');
    });

    it('shows agency_owner role in edit mode', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          user={{
            id: 'user-123',
            email: 'owner@example.com',
            full_name: 'Agency Owner',
            role: 'agency_owner',
          }}
        />
      );

      expect(screen.getByTestId('role-select')).toHaveTextContent(
        'Agency Owner'
      );
    });

    it('shows admin role in edit mode', () => {
      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          user={{
            id: 'user-123',
            email: 'admin@example.com',
            full_name: 'Admin User',
            role: 'admin',
          }}
        />
      );

      expect(screen.getByTestId('role-select')).toHaveTextContent('Admin');
    });

    it('submits with default user role', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'User created successfully',
            user: { id: 'new-user-123', email: 'newuser@example.com' },
            passwordResetSent: true,
          }),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'newuser@example.com');
      await user.tab(); // Trigger blur for email validation

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users',
          expect.objectContaining({
            body: expect.stringContaining('"role":"user"'),
          })
        );
      });
    });
  });

  // ========================================================================
  // CANCEL AND CLOSE TESTS
  // ========================================================================

  describe('Cancel and Close', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByTestId('cancel-button'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not submit form when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.click(screen.getByTestId('cancel-button'));

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    it('shows error toast when API returns error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: { message: 'A user with this email address already exists' },
          }),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(
        screen.getByTestId('email-input'),
        'existing@example.com'
      );
      await user.tab(); // Trigger blur for validation

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith(
          'Creation Failed',
          expect.objectContaining({
            description: 'A user with this email address already exists',
          })
        );
      });
    });

    it('shows generic error message when API error has no message', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.tab(); // Trigger blur for validation

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith(
          'Creation Failed',
          expect.objectContaining({
            description: 'Failed to create user',
          })
        );
      });
    });

    it('does not close modal on error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Error' } }),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.tab(); // Trigger blur for validation

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalled();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // LOADING STATE TESTS
  // ========================================================================

  describe('Loading State', () => {
    it('re-enables submit button after successful submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'User created successfully',
            user: { id: 'new-user-123', email: 'test@example.com' },
            passwordResetSent: true,
          }),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.tab(); // Trigger blur for validation

      // Button should be enabled before submission
      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      // After submission completes, the modal closes
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('re-enables buttons after failed submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Error' } }),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.tab(); // Trigger blur for validation

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      // After error, buttons should be re-enabled
      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
        expect(screen.getByTestId('cancel-button')).not.toBeDisabled();
      });
    });

    it('shows loading text during submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'User created successfully',
            user: { id: 'new-user-123', email: 'test@example.com' },
            passwordResetSent: true,
          }),
      });

      render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.tab(); // Trigger blur for validation

      // Button text should show "Create User" before submission
      expect(screen.getByTestId('submit-button')).toHaveTextContent(
        'Create User'
      );

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      // Wait for success
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  // ========================================================================
  // FORM RESET TESTS
  // ========================================================================

  describe('Form Reset', () => {
    it('resets form when modal is reopened', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('full-name-input'), 'Test User');

      // Close modal
      rerender(
        <UserFormModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Reopen modal
      rerender(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByTestId('email-input')).toHaveValue('');
      expect(screen.getByTestId('full-name-input')).toHaveValue('');
    });

    it('updates form when user prop changes', () => {
      const { rerender } = render(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          user={{
            id: 'user-1',
            email: 'user1@example.com',
            full_name: 'User One',
            role: 'user',
          }}
        />
      );

      expect(screen.getByTestId('email-input')).toHaveValue(
        'user1@example.com'
      );

      rerender(
        <UserFormModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          user={{
            id: 'user-2',
            email: 'user2@example.com',
            full_name: 'User Two',
            role: 'admin',
          }}
        />
      );

      expect(screen.getByTestId('email-input')).toHaveValue(
        'user2@example.com'
      );
      expect(screen.getByTestId('full-name-input')).toHaveValue('User Two');
    });
  });
});
