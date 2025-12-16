import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleChangeConfirmModal } from '../RoleChangeConfirmModal';

describe('RoleChangeConfirmModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <RoleChangeConfirmModal
        isOpen={true}
        userName="John Doe"
        oldRole="user"
        newRole="admin"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Change User Role')).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Confirm/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <RoleChangeConfirmModal
        isOpen={false}
        userName="John Doe"
        oldRole="user"
        newRole="admin"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText('Change User Role')).not.toBeInTheDocument();
  });

  it('displays correct role transition message', () => {
    render(
      <RoleChangeConfirmModal
        isOpen={true}
        userName="Jane Smith"
        oldRole="agency_owner"
        newRole="admin"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    const description = screen.getByText(/Jane Smith/);
    expect(description.textContent).toContain('Agency Owner');
    expect(description.textContent).toContain('Admin');
  });

  it('allows entering notes', () => {
    render(
      <RoleChangeConfirmModal
        isOpen={true}
        userName="John Doe"
        oldRole="user"
        newRole="admin"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const notesInput = screen.getByPlaceholderText(/Reason for role change/i);
    fireEvent.change(notesInput, { target: { value: 'Promoted to admin' } });

    expect(notesInput).toHaveValue('Promoted to admin');
  });

  it('calls onConfirm with notes when confirmed', async () => {
    mockOnConfirm.mockResolvedValue(undefined);

    render(
      <RoleChangeConfirmModal
        isOpen={true}
        userName="John Doe"
        oldRole="user"
        newRole="admin"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const notesInput = screen.getByPlaceholderText(/Reason for role change/i);
    fireEvent.change(notesInput, { target: { value: 'Promoted to admin' } });

    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('Promoted to admin');
    });
  });

  it('calls onConfirm with undefined when no notes entered', async () => {
    mockOnConfirm.mockResolvedValue(undefined);

    render(
      <RoleChangeConfirmModal
        isOpen={true}
        userName="John Doe"
        oldRole="user"
        newRole="admin"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(undefined);
    });
  });

  it('calls onCancel when cancel button clicked', () => {
    render(
      <RoleChangeConfirmModal
        isOpen={true}
        userName="John Doe"
        oldRole="user"
        newRole="admin"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('shows loading state during confirmation', async () => {
    let resolveConfirm: () => void;
    const confirmPromise = new Promise<void>((resolve) => {
      resolveConfirm = resolve;
    });
    mockOnConfirm.mockReturnValue(confirmPromise);

    render(
      <RoleChangeConfirmModal
        isOpen={true}
        userName="John Doe"
        oldRole="user"
        newRole="admin"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(confirmButton).toBeDisabled();
    });

    resolveConfirm!();
  });

  it('disables inputs during loading', async () => {
    let resolveConfirm: () => void;
    const confirmPromise = new Promise<void>((resolve) => {
      resolveConfirm = resolve;
    });
    mockOnConfirm.mockReturnValue(confirmPromise);

    render(
      <RoleChangeConfirmModal
        isOpen={true}
        userName="John Doe"
        oldRole="user"
        newRole="admin"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      const notesInput = screen.getByPlaceholderText(/Reason for role change/i);
      expect(notesInput).toBeDisabled();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
    });

    resolveConfirm!();
  });

  it('clears notes after confirmation', async () => {
    mockOnConfirm.mockResolvedValue(undefined);

    const { rerender } = render(
      <RoleChangeConfirmModal
        isOpen={true}
        userName="John Doe"
        oldRole="user"
        newRole="admin"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const notesInput = screen.getByPlaceholderText(/Reason for role change/i);
    fireEvent.change(notesInput, { target: { value: 'Test notes' } });

    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
    });

    rerender(
      <RoleChangeConfirmModal
        isOpen={true}
        userName="John Doe"
        oldRole="user"
        newRole="admin"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const notesInputAfter = screen.getByPlaceholderText(
      /Reason for role change/i
    );
    expect(notesInputAfter).toHaveValue('');
  });
});
