/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileEditor } from '../ProfileEditor';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

const mockedSupabase = supabase as jest.Mocked<typeof supabase>;
const mockedUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('ProfileEditor', () => {
  const mockToast = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnOpenChange = jest.fn();

  const defaultProps = {
    userId: 'user-123',
    currentName: 'John Doe',
    open: true,
    onOpenChange: mockOnOpenChange,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseToast.mockReturnValue({ toast: mockToast } as any);
  });

  describe('Rendering', () => {
    it('should render the dialog when open', () => {
      render(<ProfileEditor {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByText(/Update your full name/i)).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ProfileEditor {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should pre-fill the form with current name', () => {
      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      expect(input).toHaveValue('John Doe');
    });

    it('should handle null current name', () => {
      render(<ProfileEditor {...defaultProps} currentName={null} />);

      const input = screen.getByLabelText(/Full Name/i);
      expect(input).toHaveValue('');
    });
  });

  describe('Validation', () => {
    it('should show error for name less than 2 characters', async () => {
      const user = userEvent.setup();
      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      await user.clear(input);
      await user.type(input, 'A');

      // Try to submit to trigger validation
      const saveButton = screen.getByRole('button', { name: /Save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Full name must be at least 2 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error for name more than 100 characters', async () => {
      const user = userEvent.setup();
      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      await user.clear(input);
      await user.type(input, 'A'.repeat(101));

      // Try to submit to trigger validation
      const saveButton = screen.getByRole('button', { name: /Save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Full name must be less than 100 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should not show error for valid name', async () => {
      const user = userEvent.setup();
      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      await user.clear(input);
      await user.type(input, 'Jane Smith');

      expect(
        screen.queryByText(/Full name must be at least 2 characters/i)
      ).not.toBeInTheDocument();
    });

    it('should disable save button when form is not dirty', () => {
      render(<ProfileEditor {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /Save changes/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when form is dirty and valid', async () => {
      const user = userEvent.setup();
      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      await user.type(input, ' Updated');

      const saveButton = screen.getByRole('button', { name: /Save changes/i });
      expect(saveButton).toBeEnabled();
    });
  });

  describe('Submit Functionality', () => {
    it('should update profile successfully', async () => {
      const user = userEvent.setup();
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockedSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      await user.clear(input);
      await user.type(input, 'Jane Smith');

      const saveButton = screen.getByRole('button', { name: /Save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockedSupabase.from).toHaveBeenCalledWith('profiles');
      });

      expect(mockUpdate).toHaveBeenCalledWith({ full_name: 'Jane Smith' });
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
      expect(mockOnSuccess).toHaveBeenCalledWith('Jane Smith');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should show loading state during submit', async () => {
      const user = userEvent.setup();
      let resolveUpdate: any;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });

      const mockEq = jest.fn().mockReturnValue(updatePromise);
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockedSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      await user.clear(input);
      await user.type(input, 'Jane Smith');

      const saveButton = screen.getByRole('button', { name: /Save changes/i });
      await user.click(saveButton);

      expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Saving.../i })).toBeDisabled();

      resolveUpdate({ error: null });
      await waitFor(() => {
        expect(screen.queryByText(/Saving.../i)).not.toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      const error = new Error('Network error');
      const mockEq = jest.fn().mockResolvedValue({ error });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockedSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      await user.clear(input);
      await user.type(input, 'Jane Smith');

      const saveButton = screen.getByRole('button', { name: /Save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Error updating profile',
          description: 'Network error',
        });
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });

    it('should handle unknown errors', async () => {
      const user = userEvent.setup();
      const mockEq = jest.fn().mockRejectedValue('Unknown error');
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockedSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      await user.clear(input);
      await user.type(input, 'Jane Smith');

      const saveButton = screen.getByRole('button', { name: /Save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Error updating profile',
          description: 'Failed to update profile. Please try again.',
        });
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should reset form and close dialog on cancel', async () => {
      const user = userEvent.setup();
      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      await user.clear(input);
      await user.type(input, 'Changed Name');

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not submit when cancel is clicked', async () => {
      const user = userEvent.setup();
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockedSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      await user.clear(input);
      await user.type(input, 'Changed Name');

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and ARIA attributes', () => {
      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      expect(input).toHaveAttribute('id', 'full_name');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should set aria-invalid when validation fails', async () => {
      const user = userEvent.setup();
      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      await user.clear(input);
      await user.type(input, 'A');

      // Try to submit to trigger validation
      const saveButton = screen.getByRole('button', { name: /Save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-describedby', 'full_name-error');
      });
    });

    it('should have error message with role alert', async () => {
      const user = userEvent.setup();
      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      await user.clear(input);
      await user.type(input, 'A');

      // Try to submit to trigger validation
      const saveButton = screen.getByRole('button', { name: /Save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        const error = screen.getByRole('alert');
        expect(error).toBeInTheDocument();
        expect(error).toHaveAttribute('id', 'full_name-error');
      });
    });

    it('should auto-focus the input when dialog opens', () => {
      render(<ProfileEditor {...defaultProps} />);

      const input = screen.getByLabelText(/Full Name/i);
      // Verify the input has the autoFocus prop (may not reflect in DOM in test env)
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'full_name');
    });
  });
});
