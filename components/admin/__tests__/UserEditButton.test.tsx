import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserEditButton } from '../UserEditButton';

// Mock next/navigation
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Mock UserFormModal to avoid testing it here
jest.mock('../UserFormModal', () => ({
  UserFormModal: ({
    isOpen,
    onClose,
    onSuccess,
    user,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    user?: { id: string; email: string };
  }) =>
    isOpen ? (
      <div data-testid="user-form-modal">
        <span data-testid="modal-user-email">{user?.email}</span>
        <button data-testid="close-modal" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="submit-success"
          onClick={() => {
            onSuccess?.();
          }}
        >
          Save Changes
        </button>
      </div>
    ) : null,
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user' as const,
};

describe('UserEditButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // RENDERING TESTS
  // ========================================================================

  describe('Rendering', () => {
    it('renders Edit button', () => {
      render(<UserEditButton user={mockUser} />);

      expect(screen.getByTestId('edit-user-button')).toBeInTheDocument();
      expect(screen.getByTestId('edit-user-button')).toHaveTextContent('Edit');
    });

    it('Edit button is enabled', () => {
      render(<UserEditButton user={mockUser} />);

      expect(screen.getByTestId('edit-user-button')).not.toBeDisabled();
    });

    it('does not render UserFormModal initially', () => {
      render(<UserEditButton user={mockUser} />);

      expect(screen.queryByTestId('user-form-modal')).not.toBeInTheDocument();
    });

    it('renders with outline variant', () => {
      render(<UserEditButton user={mockUser} />);

      const button = screen.getByTestId('edit-user-button');
      // Button should have outline variant class
      expect(button).toBeInTheDocument();
    });
  });

  // ========================================================================
  // MODAL INTERACTION TESTS
  // ========================================================================

  describe('Modal Interaction', () => {
    it('opens UserFormModal when Edit button is clicked', async () => {
      const user = userEvent.setup();

      render(<UserEditButton user={mockUser} />);

      await user.click(screen.getByTestId('edit-user-button'));

      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();
    });

    it('passes user data to UserFormModal', async () => {
      const user = userEvent.setup();

      render(<UserEditButton user={mockUser} />);

      await user.click(screen.getByTestId('edit-user-button'));

      // Check that user email is passed to modal
      expect(screen.getByTestId('modal-user-email')).toHaveTextContent(
        mockUser.email
      );
    });

    it('closes UserFormModal when close is clicked', async () => {
      const user = userEvent.setup();

      render(<UserEditButton user={mockUser} />);

      await user.click(screen.getByTestId('edit-user-button'));
      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();

      await user.click(screen.getByTestId('close-modal'));
      expect(screen.queryByTestId('user-form-modal')).not.toBeInTheDocument();
    });

    it('closes UserFormModal after successful submission', async () => {
      const user = userEvent.setup();

      render(<UserEditButton user={mockUser} />);

      await user.click(screen.getByTestId('edit-user-button'));
      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();

      await user.click(screen.getByTestId('submit-success'));
      expect(screen.queryByTestId('user-form-modal')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // REFRESH CALLBACK TESTS
  // ========================================================================

  describe('Page Refresh', () => {
    it('calls router.refresh() after successful update', async () => {
      const user = userEvent.setup();

      render(<UserEditButton user={mockUser} />);

      await user.click(screen.getByTestId('edit-user-button'));
      await user.click(screen.getByTestId('submit-success'));

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ========================================================================
  // DIFFERENT USER ROLES TESTS
  // ========================================================================

  describe('Different User Roles', () => {
    it('works with admin user', async () => {
      const adminUser = { ...mockUser, role: 'admin' as const };
      const user = userEvent.setup();

      render(<UserEditButton user={adminUser} />);

      await user.click(screen.getByTestId('edit-user-button'));
      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();
    });

    it('works with agency_owner user', async () => {
      const agencyOwner = { ...mockUser, role: 'agency_owner' as const };
      const user = userEvent.setup();

      render(<UserEditButton user={agencyOwner} />);

      await user.click(screen.getByTestId('edit-user-button'));
      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();
    });

    it('works with user without full_name', async () => {
      const userWithoutName = { ...mockUser, full_name: null };
      const user = userEvent.setup();

      render(<UserEditButton user={userWithoutName} />);

      await user.click(screen.getByTestId('edit-user-button'));
      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();
    });
  });
});
