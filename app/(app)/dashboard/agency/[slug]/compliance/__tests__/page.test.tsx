/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { redirect, notFound } from 'next/navigation';
import CompliancePage from '../page';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

describe('CompliancePage', () => {
  const mockCreateClient = createClient as jest.MockedFunction<
    typeof createClient
  >;
  const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
  const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

  const mockUser = {
    id: 'user-123',
    email: 'owner@example.com',
  };

  const mockAgency = {
    id: 'agency-456',
    name: 'Test Agency',
    slug: 'test-agency',
    claimed_by: 'user-123',
  };

  const mockComplianceData = [
    {
      id: '1',
      agency_id: 'agency-456',
      compliance_type: 'osha_certified',
      is_active: true,
      is_verified: true,
      expiration_date: '2026-12-31',
      document_url: null,
      notes: null,
      verified_by: null,
      verified_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

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

    await CompliancePage({ params: Promise.resolve({ slug: 'test-agency' }) });

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to home if user is not an agency owner', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'user' }, // Not agency_owner
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    await CompliancePage({ params: Promise.resolve({ slug: 'test-agency' }) });

    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('calls notFound if agency does not exist', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'agency_owner' },
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

    await CompliancePage({
      params: Promise.resolve({ slug: 'nonexistent-agency' }),
    });

    expect(mockNotFound).toHaveBeenCalled();
  });

  it('redirects to home if user does not own the agency', async () => {
    const otherOwnerAgency = {
      ...mockAgency,
      claimed_by: 'different-user-id',
    };

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'agency_owner' },
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
                  data: otherOwnerAgency,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    await CompliancePage({ params: Promise.resolve({ slug: 'test-agency' }) });

    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('renders compliance settings page for valid owner', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'agency_owner' },
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
        } else if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockComplianceData,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const jsx = await CompliancePage({
      params: Promise.resolve({ slug: 'test-agency' }),
    });
    render(jsx as React.ReactElement);

    expect(screen.getByText('Compliance Settings')).toBeInTheDocument();
  });

  it('displays page description', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'agency_owner' },
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
        } else if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const jsx = await CompliancePage({
      params: Promise.resolve({ slug: 'test-agency' }),
    });
    render(jsx as React.ReactElement);

    expect(
      screen.getByText(/Manage your agency's compliance certifications/)
    ).toBeInTheDocument();
  });

  it('uses industrial design styling for header', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'agency_owner' },
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
        } else if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const jsx = await CompliancePage({
      params: Promise.resolve({ slug: 'test-agency' }),
    });
    render(jsx as React.ReactElement);

    const header = screen.getByText('Compliance Settings');
    expect(header).toHaveClass('font-display');
    expect(header).toHaveClass('uppercase');
  });

  it('passes compliance data to ComplianceDashboard', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'agency_owner' },
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
        } else if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockComplianceData,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const jsx = await CompliancePage({
      params: Promise.resolve({ slug: 'test-agency' }),
    });
    render(jsx as React.ReactElement);

    // Should render the ComplianceSettings component which shows all compliance types
    expect(screen.getByText('Compliance & Certifications')).toBeInTheDocument();

    // OSHA should be checked based on initial data
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toHaveAttribute('data-state', 'checked');
  });

  it('handles null compliance data gracefully', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'agency_owner' },
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
        } else if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null, // Null data
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const jsx = await CompliancePage({
      params: Promise.resolve({ slug: 'test-agency' }),
    });
    render(jsx as React.ReactElement);

    // Should render without error
    expect(screen.getByText('Compliance Settings')).toBeInTheDocument();
  });
});
