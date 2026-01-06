import { render, screen, waitFor } from '@testing-library/react';
import { redirect, notFound } from 'next/navigation';
import UserDetailPage from '../page';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/components/admin/RoleHistoryTimeline', () => ({
  RoleHistoryTimeline: ({ userId }: { userId: string }) => (
    <div data-testid="role-history-timeline">Role History for {userId}</div>
  ),
}));

jest.mock('@/components/admin/UserEditButton', () => ({
  UserEditButton: () => <button data-testid="edit-user-button">Edit</button>,
}));

jest.mock('@/components/admin/UserDeleteButton', () => ({
  UserDeleteButton: () => (
    <button data-testid="delete-user-button">Delete</button>
  ),
}));

describe('UserDetailPage', () => {
  const mockCreateClient = createClient as jest.MockedFunction<
    typeof createClient
  >;
  const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
  const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
  };

  const mockTargetUser = {
    id: 'user-456',
    email: 'user@example.com',
    full_name: 'Test User',
    role: 'user',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to login if user is not authenticated', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    await UserDetailPage({ params: { id: 'user-456' } });

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to home if user is not an admin', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'user' }, // Not admin
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    await UserDetailPage({ params: { id: 'user-456' } });

    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('calls notFound if target user does not exist', async () => {
    let callCount = 0;
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // First call: admin check
                return Promise.resolve({
                  data: { role: 'admin' },
                  error: null,
                });
              } else {
                // Second call: target user not found
                return Promise.resolve({
                  data: null,
                  error: { message: 'User not found' },
                });
              }
            }),
          }),
        }),
      })),
    } as any);

    const result = await UserDetailPage({ params: { id: 'nonexistent-user' } });

    expect(mockNotFound).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('renders user detail page with profile information', async () => {
    let callCount = 0;
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // First call: admin check
                return Promise.resolve({
                  data: { role: 'admin' },
                  error: null,
                });
              } else {
                // Second call: target user
                return Promise.resolve({
                  data: mockTargetUser,
                  error: null,
                });
              }
            }),
          }),
        }),
      })),
    } as any);

    const result = await UserDetailPage({ params: { id: 'user-456' } });

    expect(result).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('displays user profile information correctly', async () => {
    let callCount = 0;
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({
                  data: { role: 'admin' },
                  error: null,
                });
              } else {
                return Promise.resolve({
                  data: mockTargetUser,
                  error: null,
                });
              }
            }),
          }),
        }),
      })),
    } as any);

    const jsx = await UserDetailPage({ params: { id: 'user-456' } });
    render(jsx as React.ReactElement);

    // Check that user information is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument(); // Role badge
  });

  it('includes RoleHistoryTimeline component', async () => {
    let callCount = 0;
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({
                  data: { role: 'admin' },
                  error: null,
                });
              } else {
                return Promise.resolve({
                  data: mockTargetUser,
                  error: null,
                });
              }
            }),
          }),
        }),
      })),
    } as any);

    const jsx = await UserDetailPage({ params: { id: 'user-456' } });
    render(jsx as React.ReactElement);

    expect(screen.getByTestId('role-history-timeline')).toBeInTheDocument();
    expect(screen.getByText('Role History for user-456')).toBeInTheDocument();
  });

  it('displays back button to users list', async () => {
    let callCount = 0;
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({
                  data: { role: 'admin' },
                  error: null,
                });
              } else {
                return Promise.resolve({
                  data: mockTargetUser,
                  error: null,
                });
              }
            }),
          }),
        }),
      })),
    } as any);

    const jsx = await UserDetailPage({ params: { id: 'user-456' } });
    render(jsx as React.ReactElement);

    expect(screen.getByText('Back to Users')).toBeInTheDocument();
  });

  it('handles user with no full name', async () => {
    const userWithoutName = {
      ...mockTargetUser,
      full_name: null,
    };

    let callCount = 0;
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({
                  data: { role: 'admin' },
                  error: null,
                });
              } else {
                return Promise.resolve({
                  data: userWithoutName,
                  error: null,
                });
              }
            }),
          }),
        }),
      })),
    } as any);

    const jsx = await UserDetailPage({ params: { id: 'user-456' } });
    render(jsx as React.ReactElement);

    expect(screen.getByText('Not provided')).toBeInTheDocument();
  });

  it('displays correct role badge for agency_owner', async () => {
    const agencyOwnerUser = {
      ...mockTargetUser,
      role: 'agency_owner' as const,
    };

    let callCount = 0;
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({
                  data: { role: 'admin' },
                  error: null,
                });
              } else {
                return Promise.resolve({
                  data: agencyOwnerUser,
                  error: null,
                });
              }
            }),
          }),
        }),
      })),
    } as any);

    const jsx = await UserDetailPage({ params: { id: 'user-456' } });
    render(jsx as React.ReactElement);

    expect(screen.getByText('Agency Owner')).toBeInTheDocument();
  });

  it('displays correct role badge for admin', async () => {
    const adminUserTarget = {
      ...mockTargetUser,
      role: 'admin' as const,
    };

    let callCount = 0;
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({
                  data: { role: 'admin' },
                  error: null,
                });
              } else {
                return Promise.resolve({
                  data: adminUserTarget,
                  error: null,
                });
              }
            }),
          }),
        }),
      })),
    } as any);

    const jsx = await UserDetailPage({ params: { id: 'user-456' } });
    render(jsx as React.ReactElement);

    // Should have multiple "Admin" text (in badge and possibly elsewhere)
    const adminTexts = screen.getAllByText('Admin');
    expect(adminTexts.length).toBeGreaterThan(0);
  });
});
