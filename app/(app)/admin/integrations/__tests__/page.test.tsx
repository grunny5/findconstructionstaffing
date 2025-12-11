import { render, screen } from '@testing-library/react';
import { createClient } from '@/lib/supabase/server';
import AdminIntegrationsPageOptimized from '../page-optimized';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('AdminIntegrationsPageOptimized', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should redirect to login if user is not authenticated', async () => {
    const { redirect } = require('next/navigation');

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Mock RPC to return empty data (won't be used due to redirect)
    mockSupabase.rpc.mockResolvedValue({
      data: [],
      error: null,
    });

    await AdminIntegrationsPageOptimized();

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('should fetch and display integrations using RPC', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@findconstructionstaffing.com',
    };
    const mockIntegrations = [
      {
        id: 'comp-1',
        name: 'Test Company 1',
        created_at: '2024-01-01T00:00:00Z',
        config_is_active: true,
        config_last_sync_at: '2024-01-15T10:00:00Z',
        config_created_at: '2024-01-01T00:00:00Z',
        config_updated_at: '2024-01-15T10:00:00Z',
        last_sync_status: 'success',
        last_sync_created_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'comp-2',
        name: 'Test Company 2',
        created_at: '2024-01-02T00:00:00Z',
        config_is_active: false,
        config_last_sync_at: null,
        config_created_at: null,
        config_updated_at: null,
        last_sync_status: null,
        last_sync_created_at: null,
      },
    ];

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.rpc.mockResolvedValue({
      data: mockIntegrations,
      error: null,
    });

    const { container } = render(await AdminIntegrationsPageOptimized());

    // Verify RPC was called
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'get_admin_integrations_summary'
    );

    // Check that companies are displayed
    expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    expect(screen.getByText('Test Company 2')).toBeInTheDocument();

    // Check status badges
    const activeStatus = screen.getByText('Active');
    const inactiveStatus = screen.getByText('Inactive');

    expect(activeStatus).toHaveClass('bg-green-100');
    expect(inactiveStatus).toHaveClass('bg-gray-100');

    // Check sync status is displayed
    expect(screen.getByText(/Last sync: success/)).toBeInTheDocument();
  });

  it('should handle RPC errors gracefully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@findconstructionstaffing.com',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const { container } = render(await AdminIntegrationsPageOptimized());

    expect(screen.getByText('Error loading integrations')).toBeInTheDocument();
  });

  it('should handle empty integrations list', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@findconstructionstaffing.com',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.rpc.mockResolvedValue({
      data: [],
      error: null,
    });

    const { container } = render(await AdminIntegrationsPageOptimized());

    expect(screen.getByText('Integration Management')).toBeInTheDocument();
    // Verify no integration items are rendered
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('should redirect non-admin users to home page', async () => {
    const { redirect } = require('next/navigation');
    const nonAdminUser = { id: 'user-456', email: 'user@example.com' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: nonAdminUser },
      error: null,
    });

    // Mock RPC to return empty data (won't be used due to redirect)
    mockSupabase.rpc.mockResolvedValue({
      data: [],
      error: null,
    });

    await AdminIntegrationsPageOptimized();

    expect(redirect).toHaveBeenCalledWith('/');
  });
});
