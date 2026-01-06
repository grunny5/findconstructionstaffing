import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import AdminUsersPage from '../page';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/components/admin/UsersTable', () => ({
  UsersTable: ({ users }: { users: Profile[] }) => (
    <div data-testid="users-table">
      <p>Users count: {users.length}</p>
    </div>
  ),
}));

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
    email: 'user@example.com',
    full_name: 'Regular User',
    role: 'user',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    last_password_change: '2024-01-02T00:00:00Z',
  },
];

describe('AdminUsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to login if not authenticated', async () => {
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    await AdminUsersPage();

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to login if auth error', async () => {
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Auth error'),
        }),
      },
    });

    await AdminUsersPage();

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to home if user is not admin', async () => {
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: '1' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null,
      }),
    });

    await AdminUsersPage();

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('redirects to home if profile not found', async () => {
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: '1' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Profile not found'),
      }),
    });

    await AdminUsersPage();

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('renders error state when users fetch fails', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: '1' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: { role: 'admin' },
      error: null,
    });

    mockSupabase.order.mockResolvedValueOnce({
      data: null,
      error: new Error('Database error'),
    });

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    const result = await AdminUsersPage();
    const { container } = render(result as React.ReactElement);

    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(
      screen.getByText('Error loading users. Please try again later.')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.bg-industrial-orange-100')
    ).toBeInTheDocument();
  });

  it('renders users table when admin authenticated and users fetched', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: '1' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: { role: 'admin' },
      error: null,
    });

    mockSupabase.order.mockResolvedValueOnce({
      data: mockUsers,
      error: null,
    });

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    const result = await AdminUsersPage();
    const { container } = render(result as React.ReactElement);

    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByTestId('users-table')).toBeInTheDocument();
    expect(screen.getByText('Users count: 2')).toBeInTheDocument();
  });

  it('handles empty users array', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: '1' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: { role: 'admin' },
      error: null,
    });

    mockSupabase.order.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    const result = await AdminUsersPage();
    const { container } = render(result as React.ReactElement);

    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByTestId('users-table')).toBeInTheDocument();
    expect(screen.getByText('Users count: 0')).toBeInTheDocument();
  });
});
