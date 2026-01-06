import { render, screen, fireEvent } from '@testing-library/react';
import { UserDeleteDialog } from '../UserDeleteDialog';

describe('UserDeleteDialog', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
  };

  const defaultProps = {
    isOpen: true,
    onOpenChange: jest.fn(),
    user: mockUser,
    onConfirm: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders user name and email when both are provided', () => {
      render(<UserDeleteDialog {...defaultProps} />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('renders only email when full_name is null', () => {
      const userWithoutName = {
        ...mockUser,
        full_name: null,
      };

      render(<UserDeleteDialog {...defaultProps} user={userWithoutName} />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      // Email should appear as the primary identifier, not in parentheses
      expect(
        screen.queryByText((content, element) => {
          return (
            element?.tagName === 'STRONG' && content === 'test@example.com'
          );
        })
      ).toBeInTheDocument();
    });

    it('renders delete confirmation title', () => {
      render(<UserDeleteDialog {...defaultProps} />);

      expect(screen.getByText('Delete User Account?')).toBeInTheDocument();
    });

    it('renders warning message that action cannot be undone', () => {
      render(<UserDeleteDialog {...defaultProps} />);

      expect(
        screen.getByText('This action cannot be undone.')
      ).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      render(<UserDeleteDialog {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: 'Cancel' })
      ).toBeInTheDocument();
    });

    it('renders Delete User button', () => {
      render(<UserDeleteDialog {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: 'Delete User' })
      ).toBeInTheDocument();
    });

    it('renders AlertCircle icon', () => {
      render(<UserDeleteDialog {...defaultProps} />);

      // The icon should be in a red background container
      const iconContainer = document.querySelector('.bg-red-100');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Dialog State', () => {
    it('is visible when isOpen is true', () => {
      render(<UserDeleteDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('is not visible when isOpen is false', () => {
      render(<UserDeleteDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onConfirm when Delete User button is clicked', () => {
      render(<UserDeleteDialog {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete User' });
      fireEvent.click(deleteButton);

      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenChange with false when Cancel button is clicked', () => {
      render(<UserDeleteDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange when Escape key is pressed', () => {
      render(<UserDeleteDialog {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Loading State', () => {
    it('shows "Deleting..." text when loading', () => {
      render(<UserDeleteDialog {...defaultProps} isLoading={true} />);

      expect(
        screen.getByRole('button', { name: 'Deleting...' })
      ).toBeInTheDocument();
    });

    it('disables Delete button when loading', () => {
      render(<UserDeleteDialog {...defaultProps} isLoading={true} />);

      const deleteButton = screen.getByRole('button', { name: 'Deleting...' });
      expect(deleteButton).toBeDisabled();
    });

    it('disables Cancel button when loading', () => {
      render(<UserDeleteDialog {...defaultProps} isLoading={true} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeDisabled();
    });

    it('does not disable buttons when not loading', () => {
      render(<UserDeleteDialog {...defaultProps} isLoading={false} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete User' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });

      expect(deleteButton).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has correct role of alertdialog', () => {
      render(<UserDeleteDialog {...defaultProps} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('has delete button with data-testid', () => {
      render(<UserDeleteDialog {...defaultProps} />);

      expect(screen.getByTestId('confirm-delete-button')).toBeInTheDocument();
    });
  });
});
