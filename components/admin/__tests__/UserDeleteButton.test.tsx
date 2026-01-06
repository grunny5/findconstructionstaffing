import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserDeleteButton } from '../UserDeleteButton';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useToast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock UserDeleteDialog
jest.mock('../UserDeleteDialog', () => ({
  UserDeleteDialog: ({
    isOpen,
    onOpenChange,
    user,
    onConfirm,
    isLoading,
  }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    user: { id: string; email: string; full_name?: string | null };
    onConfirm: () => void;
    isLoading?: boolean;
  }) =>
    isOpen ? (
      <div data-testid="delete-dialog">
        <span data-testid="dialog-user-email">{user?.email}</span>
        <span data-testid="dialog-loading">
          {isLoading ? 'loading' : 'idle'}
        </span>
        <button data-testid="cancel-dialog" onClick={() => onOpenChange(false)}>
          Cancel
        </button>
        <button data-testid="confirm-delete" onClick={onConfirm}>
          Delete
        </button>
      </div>
    ) : null,
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
};

const currentUserId = 'admin-456';

describe('UserDeleteButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ========================================================================
  // RENDERING TESTS
  // ========================================================================

  describe('Rendering', () => {
    it('renders Delete button for other users', () => {
      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      expect(screen.getByTestId('delete-user-button')).toBeInTheDocument();
      expect(screen.getByTestId('delete-user-button')).toHaveTextContent(
        'Delete'
      );
    });

    it('does not render Delete button when viewing own profile', () => {
      render(<UserDeleteButton user={mockUser} currentUserId={mockUser.id} />);

      expect(
        screen.queryByTestId('delete-user-button')
      ).not.toBeInTheDocument();
    });

    it('renders with destructive variant', () => {
      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      const button = screen.getByTestId('delete-user-button');
      expect(button).toBeInTheDocument();
    });

    it('does not render UserDeleteDialog initially', () => {
      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // DIALOG INTERACTION TESTS
  // ========================================================================

  describe('Dialog Interaction', () => {
    it('opens UserDeleteDialog when Delete button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      await user.click(screen.getByTestId('delete-user-button'));

      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    it('passes user data to UserDeleteDialog', async () => {
      const user = userEvent.setup();

      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      await user.click(screen.getByTestId('delete-user-button'));

      expect(screen.getByTestId('dialog-user-email')).toHaveTextContent(
        mockUser.email
      );
    });

    it('closes UserDeleteDialog when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      await user.click(screen.getByTestId('delete-user-button'));
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('cancel-dialog'));
      expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // API CALL TESTS
  // ========================================================================

  describe('API Calls', () => {
    it('calls DELETE API when confirm is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'User deleted successfully' }),
      });

      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      await user.click(screen.getByTestId('delete-user-button'));
      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/admin/users/${mockUser.id}`,
          { method: 'DELETE' }
        );
      });
    });

    it('shows success toast and redirects on successful deletion', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'User deleted successfully' }),
      });

      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      await user.click(screen.getByTestId('delete-user-button'));
      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'User deleted',
          description: 'Test User has been deleted successfully.',
        });
      });

      expect(mockPush).toHaveBeenCalledWith('/admin/users');
    });

    it('shows user email in success message when full_name is null', async () => {
      const user = userEvent.setup();
      const userWithoutName = { ...mockUser, full_name: null };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'User deleted successfully' }),
      });

      render(
        <UserDeleteButton
          user={userWithoutName}
          currentUserId={currentUserId}
        />
      );

      await user.click(screen.getByTestId('delete-user-button'));
      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'User deleted',
          description: 'test@example.com has been deleted successfully.',
        });
      });
    });

    it('shows error toast for claimed agency conflict (409)', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            error: {
              code: 'CONFLICT',
              message:
                'Cannot delete user who owns a claimed agency. Unclaim the agency first.',
              details: {
                claimed_agencies: [
                  { id: 'agency-1', name: 'Test Agency', slug: 'test-agency' },
                ],
              },
            },
          }),
      });

      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      await user.click(screen.getByTestId('delete-user-button'));
      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Cannot delete user',
          description:
            'User owns claimed agencies: Test Agency. Unclaim these agencies first.',
        });
      });

      // Should NOT redirect on error
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows multiple agency names in conflict error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            error: {
              code: 'CONFLICT',
              message:
                'Cannot delete user who owns a claimed agency. Unclaim the agency first.',
              details: {
                claimed_agencies: [
                  { id: 'agency-1', name: 'Agency One', slug: 'agency-one' },
                  { id: 'agency-2', name: 'Agency Two', slug: 'agency-two' },
                ],
              },
            },
          }),
      });

      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      await user.click(screen.getByTestId('delete-user-button'));
      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Cannot delete user',
          description:
            'User owns claimed agencies: Agency One, Agency Two. Unclaim these agencies first.',
        });
      });
    });

    it('shows generic error toast for other API errors', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to delete user',
            },
          }),
      });

      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      await user.click(screen.getByTestId('delete-user-button'));
      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete user',
        });
      });
    });

    it('shows generic error toast on fetch exception', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      await user.click(screen.getByTestId('delete-user-button'));
      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Error',
          description: 'An unexpected error occurred',
        });
      });
    });

    it('closes dialog after successful deletion', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'User deleted successfully' }),
      });

      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      await user.click(screen.getByTestId('delete-user-button'));
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
      });
    });

    it('keeps dialog open on API error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to delete user',
            },
          }),
      });

      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      await user.click(screen.getByTestId('delete-user-button'));
      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      // Dialog should remain open on error
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // LOADING STATE TESTS
  // ========================================================================

  describe('Loading State', () => {
    it('shows loading state while API call is in progress', async () => {
      const user = userEvent.setup();

      // Create a promise that we can resolve manually
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(pendingPromise);

      render(
        <UserDeleteButton user={mockUser} currentUserId={currentUserId} />
      );

      await user.click(screen.getByTestId('delete-user-button'));
      await user.click(screen.getByTestId('confirm-delete'));

      // Check loading state is shown
      await waitFor(() => {
        expect(screen.getByTestId('dialog-loading')).toHaveTextContent(
          'loading'
        );
      });

      // Resolve the promise to clean up
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ message: 'User deleted successfully' }),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
      });
    });
  });
});
