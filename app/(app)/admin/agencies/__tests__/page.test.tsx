/**
 * Tests for Admin Agencies Page
 *
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import AdminAgenciesPage from '../page';
import { createClient } from '@/lib/supabase/server';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/supabase/server');

jest.mock('@/components/admin/AdminAgenciesTable', () => ({
  AdminAgenciesTable: ({
    agencies,
  }: {
    agencies: Array<{ id: string; name: string }>;
  }) => (
    <div data-testid="agencies-table">
      <p>Agencies count: {agencies.length}</p>
      {agencies.map((a) => (
        <div key={a.id} data-testid={`agency-${a.id}`}>
          {a.name}
        </div>
      ))}
    </div>
  ),
}));

const mockedCreateClient = jest.mocked(createClient);
const mockedRedirect = jest.mocked(redirect);

const mockAgencies = [
  {
    id: '1',
    name: 'Test Agency 1',
    slug: 'test-agency-1',
    is_active: true,
    is_claimed: true,
    claimed_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    profile_completion_percentage: 80,
  },
  {
    id: '2',
    name: 'Test Agency 2',
    slug: 'test-agency-2',
    is_active: false,
    is_claimed: false,
    claimed_by: null,
    created_at: '2024-01-02T00:00:00Z',
    profile_completion_percentage: 30,
  },
];

const mockProfiles = [
  {
    id: 'user-1',
    email: 'owner@example.com',
    full_name: 'Agency Owner',
  },
];

describe('AdminAgenciesPage', () => {
  let mockSupabaseClient: {
    auth: {
      getUser: jest.Mock;
    };
    from: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    mockedCreateClient.mockResolvedValue(mockSupabaseClient as never);
    mockedRedirect.mockImplementation((url: string) => {
      throw new Error(`Redirecting to ${url}`);
    });
  });

  describe('Authentication', () => {
    it('redirects to login if not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(AdminAgenciesPage()).rejects.toThrow(
        'Redirecting to /login'
      );
      expect(mockedRedirect).toHaveBeenCalledWith('/login');
    });

    it('redirects to login if auth error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error'),
      });

      await expect(AdminAgenciesPage()).rejects.toThrow(
        'Redirecting to /login'
      );
      expect(mockedRedirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('Admin Role Verification', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: '1' } },
        error: null,
      });
    });

    it('redirects to home if user is not admin', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      await expect(AdminAgenciesPage()).rejects.toThrow('Redirecting to /');
      expect(mockedRedirect).toHaveBeenCalledWith('/');
    });

    it('redirects to home if profile not found', async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Profile not found'),
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockProfileQuery);

      await expect(AdminAgenciesPage()).rejects.toThrow('Redirecting to /');
      expect(mockedRedirect).toHaveBeenCalledWith('/');
    });
  });

  describe('Page Rendering', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });

      // Don't throw on redirect for rendering tests
      mockedRedirect.mockImplementation(() => undefined as never);
    });

    it('renders error state when agencies fetch fails', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        };
      });

      const result = await AdminAgenciesPage();
      render(result as React.ReactElement);

      expect(screen.getByText('Agency Management')).toBeInTheDocument();
      expect(
        screen.getByText('Error loading agencies. Please try again later.')
      ).toBeInTheDocument();
    });

    it('renders agencies table when admin authenticated', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: mockAgencies,
            error: null,
          }),
        };
      });

      const result = await AdminAgenciesPage();
      render(result as React.ReactElement);

      expect(screen.getByText('Agency Management')).toBeInTheDocument();
      expect(screen.getByTestId('agencies-table')).toBeInTheDocument();
      expect(screen.getByText('Agencies count: 2')).toBeInTheDocument();
    });

    it('renders header with Create Agency, Bulk Import, and Download Template buttons', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      });

      const result = await AdminAgenciesPage();
      render(result as React.ReactElement);

      expect(screen.getByText('Create Agency')).toBeInTheDocument();
      expect(screen.getByText('Bulk Import')).toBeInTheDocument();
      expect(screen.getByText('Download Template')).toBeInTheDocument();
    });

    it('renders Download Template button with correct link to template endpoint', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      });

      const result = await AdminAgenciesPage();
      render(result as React.ReactElement);

      const downloadButton = screen.getByTestId('download-template-button');
      expect(downloadButton).toBeInTheDocument();
      expect(downloadButton).toHaveAttribute(
        'href',
        '/api/admin/agencies/template'
      );
    });

    it('handles empty agencies array', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      });

      const result = await AdminAgenciesPage();
      render(result as React.ReactElement);

      expect(screen.getByText('Agency Management')).toBeInTheDocument();
      expect(screen.getByTestId('agencies-table')).toBeInTheDocument();
      expect(screen.getByText('Agencies count: 0')).toBeInTheDocument();
    });
  });
});
