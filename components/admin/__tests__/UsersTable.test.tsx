import { render, screen, fireEvent } from '@testing-library/react';
import { UsersTable } from '../UsersTable';
import type { Profile } from '@/types/database';

const mockUsers: Profile[] = [
  {
    id: '1',
    email: 'admin@example.com',
    full_name: 'Admin User',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_password_change: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'agency@example.com',
    full_name: 'Agency Owner',
    role: 'agency_owner',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    last_password_change: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    email: 'user@example.com',
    full_name: 'Regular User',
    role: 'user',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    last_password_change: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    email: 'john.doe@example.com',
    full_name: 'John Doe',
    role: 'user',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    last_password_change: '2024-01-04T00:00:00Z',
  },
];

describe('UsersTable', () => {
  it('renders all users in table', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getAllByText('Agency Owner')).toHaveLength(2);
    expect(screen.getByText('Regular User')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays correct role badges', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getAllByText('Agency Owner')).toHaveLength(2);
    expect(screen.getAllByText('User')).toHaveLength(2);
  });

  it('filters users by search query (email)', () => {
    render(<UsersTable users={mockUsers} />);

    const searchInput = screen.getByPlaceholderText(
      'Search by name or email...'
    );
    fireEvent.change(searchInput, { target: { value: 'agency' } });

    expect(screen.getAllByText('Agency Owner')).toHaveLength(2);
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
    expect(screen.queryByText('Regular User')).not.toBeInTheDocument();
  });

  it('filters users by search query (name)', () => {
    render(<UsersTable users={mockUsers} />);

    const searchInput = screen.getByPlaceholderText(
      'Search by name or email...'
    );
    fireEvent.change(searchInput, { target: { value: 'john' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
  });

  it('filters users by role', () => {
    render(<UsersTable users={mockUsers} />);

    const roleSelect = screen.getByRole('combobox');
    fireEvent.click(roleSelect);

    const adminOption = screen.getByRole('option', { name: 'Admin' });
    fireEvent.click(adminOption);

    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.queryByText('Agency Owner')).not.toBeInTheDocument();
    expect(screen.queryByText('Regular User')).not.toBeInTheDocument();
  });

  it('shows empty state when no users match filters', () => {
    render(<UsersTable users={mockUsers} />);

    const searchInput = screen.getByPlaceholderText(
      'Search by name or email...'
    );
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(
      screen.getByText('No users found matching your filters.')
    ).toBeInTheDocument();
  });

  it('shows empty state when no users provided', () => {
    render(<UsersTable users={[]} />);

    expect(screen.getByText('No users found.')).toBeInTheDocument();
  });

  it('displays formatted dates', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 2, 2024/)).toBeInTheDocument();
  });

  it('shows Change Role button for each user', () => {
    render(<UsersTable users={mockUsers} />);

    const changeRoleButtons = screen.getAllByText('Change Role');
    expect(changeRoleButtons).toHaveLength(mockUsers.length);
  });

  it('resets to page 1 when search query changes', () => {
    const manyUsers: Profile[] = Array.from({ length: 120 }, (_, i) => ({
      id: `${i}`,
      email: `user${i}@example.com`,
      full_name: `User ${i}`,
      role: 'user' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_password_change: '2024-01-01T00:00:00Z',
    }));

    render(<UsersTable users={manyUsers} />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      'Search by name or email...'
    );
    fireEvent.change(searchInput, { target: { value: '@example.com' } });

    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  it('handles pagination correctly', () => {
    const manyUsers: Profile[] = Array.from({ length: 60 }, (_, i) => ({
      id: `${i}`,
      email: `user${i}@example.com`,
      full_name: `User ${i}`,
      role: 'user' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_password_change: '2024-01-01T00:00:00Z',
    }));

    render(<UsersTable users={manyUsers} />);

    expect(screen.getByText(/Showing 1-50 of 60 users/)).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(screen.getByText(/Showing 51-60 of 60 users/)).toBeInTheDocument();
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();

    const prevButton = screen.getByText('Previous');
    fireEvent.click(prevButton);

    expect(screen.getByText(/Showing 1-50 of 60 users/)).toBeInTheDocument();
  });

  it('disables Previous button on first page', () => {
    const manyUsers: Profile[] = Array.from({ length: 60 }, (_, i) => ({
      id: `${i}`,
      email: `user${i}@example.com`,
      full_name: `User ${i}`,
      role: 'user' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_password_change: '2024-01-01T00:00:00Z',
    }));

    render(<UsersTable users={manyUsers} />);

    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    const manyUsers: Profile[] = Array.from({ length: 60 }, (_, i) => ({
      id: `${i}`,
      email: `user${i}@example.com`,
      full_name: `User ${i}`,
      role: 'user' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_password_change: '2024-01-01T00:00:00Z',
    }));

    render(<UsersTable users={manyUsers} />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(nextButton).toBeDisabled();
  });

  it('hides pagination when total users fit on one page', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });
});
