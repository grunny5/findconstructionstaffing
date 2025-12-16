import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleChangeDropdown } from '../RoleChangeDropdown';
import type { UserRole } from '@/types/database';

describe('RoleChangeDropdown', () => {
  const mockOnRoleChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with current role selected', () => {
    render(
      <RoleChangeDropdown
        userId="user-1"
        userName="John Doe"
        currentRole="user"
        onRoleChange={mockOnRoleChange}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveTextContent('User');
  });

  it('opens modal when selecting a new role', async () => {
    render(
      <RoleChangeDropdown
        userId="user-1"
        userName="John Doe"
        currentRole="user"
        onRoleChange={mockOnRoleChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.click(select);

    const adminOption = screen.getByRole('option', { name: 'Admin' });
    fireEvent.click(adminOption);

    await waitFor(() => {
      expect(screen.getByText(/Change User Role/i)).toBeInTheDocument();
    });
  });

  it('does not open modal when selecting current role', () => {
    render(
      <RoleChangeDropdown
        userId="user-1"
        userName="John Doe"
        currentRole="user"
        onRoleChange={mockOnRoleChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.click(select);

    const userOption = screen.getByRole('option', { name: 'User' });
    fireEvent.click(userOption);

    expect(screen.queryByText(/Change User Role/i)).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <RoleChangeDropdown
        userId="user-1"
        userName="John Doe"
        currentRole="user"
        onRoleChange={mockOnRoleChange}
        disabled
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('calls onRoleChange when confirmed', async () => {
    mockOnRoleChange.mockResolvedValue(undefined);

    render(
      <RoleChangeDropdown
        userId="user-1"
        userName="John Doe"
        currentRole="user"
        onRoleChange={mockOnRoleChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.click(select);

    const adminOption = screen.getByRole('option', { name: 'Admin' });
    fireEvent.click(adminOption);

    await waitFor(() => {
      expect(screen.getByText(/Change User Role/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnRoleChange).toHaveBeenCalledWith(
        'user-1',
        'admin',
        undefined
      );
    });
  });

  it('does not call onRoleChange when cancelled', async () => {
    render(
      <RoleChangeDropdown
        userId="user-1"
        userName="John Doe"
        currentRole="user"
        onRoleChange={mockOnRoleChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.click(select);

    const adminOption = screen.getByRole('option', { name: 'Admin' });
    fireEvent.click(adminOption);

    await waitFor(() => {
      expect(screen.getByText(/Change User Role/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnRoleChange).not.toHaveBeenCalled();
      expect(screen.queryByText(/Change User Role/i)).not.toBeInTheDocument();
    });
  });

  it('handles all role types', async () => {
    const roles: UserRole[] = ['user', 'agency_owner', 'admin'];

    for (const role of roles) {
      const { unmount } = render(
        <RoleChangeDropdown
          userId="user-1"
          userName="John Doe"
          currentRole={role}
          onRoleChange={mockOnRoleChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      unmount();
    }
  });
});
