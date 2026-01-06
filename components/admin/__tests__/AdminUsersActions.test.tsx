import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminUsersActions } from '../AdminUsersActions';

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
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
  }) =>
    isOpen ? (
      <div data-testid="user-form-modal">
        <button data-testid="close-modal" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="submit-success"
          onClick={() => {
            onSuccess?.();
            onClose();
          }}
        >
          Submit
        </button>
      </div>
    ) : null,
}));

describe('AdminUsersActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // RENDERING TESTS
  // ========================================================================

  describe('Rendering', () => {
    it('renders Create User button', () => {
      render(<AdminUsersActions />);

      expect(screen.getByTestId('create-user-button')).toBeInTheDocument();
      expect(screen.getByTestId('create-user-button')).toHaveTextContent(
        'Create User'
      );
    });

    it('Create User button is enabled', () => {
      render(<AdminUsersActions />);

      expect(screen.getByTestId('create-user-button')).not.toBeDisabled();
    });

    it('does not render UserFormModal initially', () => {
      render(<AdminUsersActions />);

      expect(screen.queryByTestId('user-form-modal')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // MODAL INTERACTION TESTS
  // ========================================================================

  describe('Modal Interaction', () => {
    it('opens UserFormModal when Create User button is clicked', async () => {
      const user = userEvent.setup();

      render(<AdminUsersActions />);

      await user.click(screen.getByTestId('create-user-button'));

      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();
    });

    it('closes UserFormModal when close is clicked', async () => {
      const user = userEvent.setup();

      render(<AdminUsersActions />);

      await user.click(screen.getByTestId('create-user-button'));
      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();

      await user.click(screen.getByTestId('close-modal'));
      expect(screen.queryByTestId('user-form-modal')).not.toBeInTheDocument();
    });

    it('closes UserFormModal after successful submission', async () => {
      const user = userEvent.setup();

      render(<AdminUsersActions />);

      await user.click(screen.getByTestId('create-user-button'));
      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();

      await user.click(screen.getByTestId('submit-success'));
      expect(screen.queryByTestId('user-form-modal')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // REFRESH CALLBACK TESTS
  // ========================================================================

  describe('Refresh Callback', () => {
    it('calls onRefresh callback after successful creation', async () => {
      const user = userEvent.setup();
      const mockOnRefresh = jest.fn();

      render(<AdminUsersActions onRefresh={mockOnRefresh} />);

      await user.click(screen.getByTestId('create-user-button'));
      await user.click(screen.getByTestId('submit-success'));

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('calls router.refresh() when onRefresh is not provided', async () => {
      const user = userEvent.setup();

      render(<AdminUsersActions />);

      await user.click(screen.getByTestId('create-user-button'));
      await user.click(screen.getByTestId('submit-success'));

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call router.refresh() when onRefresh is provided', async () => {
      const user = userEvent.setup();
      const mockOnRefresh = jest.fn();

      render(<AdminUsersActions onRefresh={mockOnRefresh} />);

      await user.click(screen.getByTestId('create-user-button'));
      await user.click(screen.getByTestId('submit-success'));

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      });
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});
