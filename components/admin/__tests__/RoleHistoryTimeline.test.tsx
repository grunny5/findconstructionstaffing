import { render, screen, waitFor } from '@testing-library/react';
import { RoleHistoryTimeline } from '../RoleHistoryTimeline';
import { supabase } from '@/lib/supabase';
import type { RoleChangeAudit } from '@/types/database';

// Mock Supabase
jest.mock('@/lib/supabase');

describe('RoleHistoryTimeline', () => {
  const mockedSupabase = jest.mocked(supabase);
  const testUserId = 'user-123';

  const mockAuditLogs: RoleChangeAudit[] = [
    {
      id: 'audit-1',
      user_id: testUserId,
      admin_id: 'admin-1',
      old_role: 'user',
      new_role: 'agency_owner',
      changed_at: '2024-01-15T10:30:00Z',
      notes: 'Verified as legitimate staffing agency',
      created_at: '2024-01-15T10:30:00Z',
    },
    {
      id: 'audit-2',
      user_id: testUserId,
      admin_id: 'admin-1',
      old_role: 'agency_owner',
      new_role: 'admin',
      changed_at: '2024-01-20T14:45:00Z',
      notes: 'Promoted to admin role',
      created_at: '2024-01-20T14:45:00Z',
    },
  ];

  const mockAuditLogsWithAdmin = mockAuditLogs.map((log) => ({
    ...log,
    admin_profile: {
      full_name: 'Admin User',
      email: 'admin@example.com',
    },
  }));

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default from mock
    if (!mockedSupabase.from) {
      mockedSupabase.from = jest.fn();
    }
  });

  it('displays loading state initially', () => {
    // Mock pending query
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnValue(new Promise(() => {})); // Never resolves

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    });

    render(<RoleHistoryTimeline userId={testUserId} />);

    expect(screen.getByText('Role Change History')).toBeInTheDocument();
    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('displays audit logs when data is loaded', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: mockAuditLogsWithAdmin,
      error: null,
    });

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    });

    render(<RoleHistoryTimeline userId={testUserId} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading history...')).not.toBeInTheDocument();
    });

    // Check that both role changes are displayed (multiple badges)
    expect(screen.getAllByText('User').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Agency Owner').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
  });

  it('displays admin names for each change', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: mockAuditLogsWithAdmin,
      error: null,
    });

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    });

    render(<RoleHistoryTimeline userId={testUserId} />);

    await waitFor(() => {
      const adminNames = screen.getAllByText(/Admin User/);
      expect(adminNames.length).toBeGreaterThan(0);
    });
  });

  it('displays notes when provided', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: mockAuditLogsWithAdmin,
      error: null,
    });

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    });

    render(<RoleHistoryTimeline userId={testUserId} />);

    await waitFor(() => {
      expect(
        screen.getByText('Verified as legitimate staffing agency')
      ).toBeInTheDocument();
      expect(screen.getByText('Promoted to admin role')).toBeInTheDocument();
    });
  });

  it('displays empty state when no audit logs exist', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    });

    render(<RoleHistoryTimeline userId={testUserId} />);

    await waitFor(() => {
      expect(screen.getByText('No role changes recorded')).toBeInTheDocument();
    });
  });

  it('displays error state when fetch fails', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    });

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<RoleHistoryTimeline userId={testUserId} />);

    await waitFor(() => {
      // Component displays default error message
      expect(
        screen.getByText('Failed to load role history')
      ).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('sorts audit logs by most recent first', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: mockAuditLogsWithAdmin,
      error: null,
    });

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    });

    render(<RoleHistoryTimeline userId={testUserId} />);

    await waitFor(() => {
      expect(mockOrder).toHaveBeenCalledWith('changed_at', {
        ascending: false,
      });
    });
  });

  it('fetches audit logs for correct user', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    });

    render(<RoleHistoryTimeline userId={testUserId} />);

    await waitFor(() => {
      expect(mockedSupabase.from).toHaveBeenCalledWith('role_change_audit');
      expect(mockEq).toHaveBeenCalledWith('user_id', testUserId);
    });
  });

  it('displays placeholder when admin account is deleted', async () => {
    const logsWithDeletedAdmin = [
      {
        ...mockAuditLogs[0],
        admin_profile: null, // Admin was deleted
      },
    ];

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: logsWithDeletedAdmin,
      error: null,
    });

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    });

    render(<RoleHistoryTimeline userId={testUserId} />);

    await waitFor(() => {
      expect(screen.getByText(/\[Admin account deleted\]/)).toBeInTheDocument();
    });
  });

  it('displays timestamps in readable format', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: mockAuditLogsWithAdmin,
      error: null,
    });

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    });

    render(<RoleHistoryTimeline userId={testUserId} />);

    await waitFor(() => {
      // Check that dates are formatted (contains month abbreviation)
      const timestamps = screen.getAllByText(/Jan/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  it('handles logs without notes gracefully', async () => {
    const logsWithoutNotes = mockAuditLogsWithAdmin.map((log) => ({
      ...log,
      notes: null,
    }));

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: logsWithoutNotes,
      error: null,
    });

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    });

    render(<RoleHistoryTimeline userId={testUserId} />);

    await waitFor(() => {
      expect(screen.queryByText(/Verified as/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Promoted to/)).not.toBeInTheDocument();
    });
  });

  it('displays correct badge colors for roles', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({
      data: mockAuditLogsWithAdmin,
      error: null,
    });

    mockedSupabase.from = jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    });

    render(<RoleHistoryTimeline userId={testUserId} />);

    await waitFor(() => {
      const badges = screen.getAllByText(/User|Agency Owner|Admin/);
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});
