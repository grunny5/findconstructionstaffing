import { render, screen } from '@testing-library/react';
import { redirect, notFound } from 'next/navigation';
import AgencyDetailPage from '../page';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    replace: jest.fn(),
  })),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

describe('AgencyDetailPage', () => {
  const mockCreateClient = createClient as jest.MockedFunction<
    typeof createClient
  >;
  const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
  const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
  };

  const mockAgency = {
    id: 'agency-456',
    name: 'Test Agency',
    slug: 'test-agency',
    description: 'A test agency description',
    website: 'https://testagency.com',
    phone: '+12345678900',
    email: 'contact@testagency.com',
    headquarters: 'New York, NY',
    founded_year: 2010,
    employee_count: '11-50',
    company_size: 'Medium',
    offers_per_diem: true,
    is_union: false,
    is_active: true,
    is_claimed: true,
    claimed_by: 'owner-789',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
    profile_completion_percentage: 75,
  };

  const mockOwnerProfile = {
    email: 'owner@example.com',
    full_name: 'Agency Owner',
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

    await AgencyDetailPage({ params: { id: 'agency-456' } });

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

    await AgencyDetailPage({ params: { id: 'agency-456' } });

    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('calls notFound if agency does not exist', async () => {
    let callCount = 0;
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Agency not found' },
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const result = await AgencyDetailPage({
      params: { id: 'nonexistent-agency' },
    });

    expect(mockNotFound).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('renders agency detail page with basic information', async () => {
    let callCount = 0;
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles' && callCount === 0) {
          callCount++;
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockAgency,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'profiles' && callCount > 0) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockOwnerProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);
    const jsx = await AgencyDetailPage({ params: { id: 'agency-456' } });
    render(jsx as React.ReactElement);

    // Check that agency information is displayed
    expect(screen.getByText('Test Agency')).toBeInTheDocument();
    expect(screen.getByText('test-agency')).toBeInTheDocument();
    expect(screen.getByText('A test agency description')).toBeInTheDocument();
    expect(screen.getByText('contact@testagency.com')).toBeInTheDocument();
  });

  it('displays back button to agencies list', async () => {
    let profileCallIndex = 0;

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          const data =
            profileCallIndex === 0 ? { role: 'admin' } : mockOwnerProfile;
          profileCallIndex++;

          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockAgency,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const jsx = await AgencyDetailPage({ params: { id: 'agency-456' } });
    render(jsx as React.ReactElement);

    expect(screen.getByText('Back to Agencies')).toBeInTheDocument();
  });

  it('displays edit button', async () => {
    let profileCallIndex = 0;

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          const data =
            profileCallIndex === 0 ? { role: 'admin' } : mockOwnerProfile;
          profileCallIndex++;

          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockAgency,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const jsx = await AgencyDetailPage({ params: { id: 'agency-456' } });
    render(jsx as React.ReactElement);

    expect(screen.getByText('Edit Agency')).toBeInTheDocument();
  });

  it('displays owner information for claimed agency', async () => {
    let profileCallIndex = 0;

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          const data =
            profileCallIndex === 0 ? { role: 'admin' } : mockOwnerProfile;
          profileCallIndex++;

          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockAgency,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const jsx = await AgencyDetailPage({ params: { id: 'agency-456' } });
    render(jsx as React.ReactElement);

    expect(screen.getByText('Agency Owner')).toBeInTheDocument();
    expect(screen.getByText('owner@example.com')).toBeInTheDocument();
  });

  it('displays status badges correctly', async () => {
    let profileCallIndex = 0;

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          const data =
            profileCallIndex === 0 ? { role: 'admin' } : mockOwnerProfile;
          profileCallIndex++;

          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockAgency,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const jsx = await AgencyDetailPage({ params: { id: 'agency-456' } });
    render(jsx as React.ReactElement);

    expect(screen.getByText('Active')).toBeInTheDocument();
    const claimedElements = screen.getAllByText('Claimed');
    expect(claimedElements.length).toBeGreaterThan(0);
  });

  it('handles unclaimed agency without owner profile', async () => {
    const unclaimedAgency = {
      ...mockAgency,
      is_claimed: false,
      claimed_by: null,
    };

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: unclaimedAgency,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const jsx = await AgencyDetailPage({ params: { id: 'agency-456' } });
    render(jsx as React.ReactElement);

    expect(screen.getByText('Unclaimed')).toBeInTheDocument();
    expect(screen.queryByText('Owner Name')).not.toBeInTheDocument();
  });

  it('displays optional fields only when present', async () => {
    const minimalAgency = {
      id: 'agency-456',
      name: 'Minimal Agency',
      slug: 'minimal-agency',
      description: null,
      website: null,
      phone: null,
      email: null,
      headquarters: null,
      founded_year: null,
      employee_count: null,
      company_size: null,
      offers_per_diem: false,
      is_union: false,
      is_active: true,
      is_claimed: false,
      claimed_by: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T15:30:00Z',
      profile_completion_percentage: 25,
    };

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockAdminUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: minimalAgency,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const jsx = await AgencyDetailPage({ params: { id: 'agency-456' } });
    render(jsx as React.ReactElement);

    expect(screen.getByText('Minimal Agency')).toBeInTheDocument();
    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });
});
