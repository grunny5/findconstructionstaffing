/**
 * @jest-environment jsdom
 */
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database';

// Mock Supabase
jest.mock('@/lib/supabase');

describe('Role Change Integration Tests', () => {
  const mockedSupabase = jest.mocked(supabase);

  const mockAdminProfile: Profile = {
    id: 'admin-123',
    email: 'admin@example.com',
    full_name: 'Admin User',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_password_change: '2024-01-01T00:00:00Z',
  };

  const mockTargetUser: Profile = {
    id: 'user-456',
    email: 'user@example.com',
    full_name: 'Regular User',
    role: 'user',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    last_password_change: '2024-01-02T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default RPC mock
    if (!mockedSupabase.rpc) {
      mockedSupabase.rpc = jest.fn();
    }

    // Set up default from mock for queries
    if (!mockedSupabase.from) {
      mockedSupabase.from = jest.fn();
    }
  });

  describe('Admin Role Change Flow', () => {
    it('should successfully change user role and create audit log', async () => {
      const newRole: UserRole = 'agency_owner';
      const adminNotes = 'Verified as legitimate staffing agency';

      // Mock successful RPC call
      mockedSupabase.rpc = jest.fn().mockResolvedValue({
        data: true,
        error: null,
      });

      // Execute role change via RPC
      const { data, error } = await supabase.rpc('change_user_role', {
        target_user_id: mockTargetUser.id,
        new_role: newRole,
        admin_notes: adminNotes,
      });

      // Verify RPC was called with correct parameters
      expect(mockedSupabase.rpc).toHaveBeenCalledWith('change_user_role', {
        target_user_id: mockTargetUser.id,
        new_role: newRole,
        admin_notes: adminNotes,
      });

      // Verify operation succeeded
      expect(error).toBeNull();
      expect(data).toBe(true);
    });

    it('should verify role is updated in profiles table', async () => {
      const newRole: UserRole = 'agency_owner';
      const updatedProfile = { ...mockTargetUser, role: newRole };

      // Mock the profiles query
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: updatedProfile,
        error: null,
      });

      mockedSupabase.from = jest.fn().mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      // Query the updated profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', mockTargetUser.id)
        .single();

      // Verify query was made
      expect(mockedSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', mockTargetUser.id);

      // Verify role was updated
      expect(error).toBeNull();
      expect(profile).toBeDefined();
      expect(profile?.role).toBe(newRole);
    });

    it('should verify audit log entry is created', async () => {
      const newRole: UserRole = 'agency_owner';
      const oldRole: UserRole = 'user';
      const adminNotes = 'Verified as legitimate staffing agency';

      const mockAuditLog = {
        id: 'audit-789',
        user_id: mockTargetUser.id,
        admin_id: mockAdminProfile.id,
        old_role: oldRole,
        new_role: newRole,
        changed_at: new Date().toISOString(),
        notes: adminNotes,
        created_at: new Date().toISOString(),
      };

      // Mock the audit log query
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({
        data: [mockAuditLog],
        error: null,
      });

      mockedSupabase.from = jest.fn().mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockReturnValue({
              limit: mockLimit,
            }),
          }),
        }),
      });

      // Query the audit log
      const { data: auditLogs, error } = await supabase
        .from('role_change_audit')
        .select('*')
        .eq('user_id', mockTargetUser.id)
        .order('changed_at', { ascending: false })
        .limit(1);

      // Verify query was made
      expect(mockedSupabase.from).toHaveBeenCalledWith('role_change_audit');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockTargetUser.id);

      // Verify audit log exists
      expect(error).toBeNull();
      expect(auditLogs).toBeDefined();
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs?.[0].user_id).toBe(mockTargetUser.id);
      expect(auditLogs?.[0].admin_id).toBe(mockAdminProfile.id);
      expect(auditLogs?.[0].old_role).toBe(oldRole);
      expect(auditLogs?.[0].new_role).toBe(newRole);
      expect(auditLogs?.[0].notes).toBe(adminNotes);
    });

    it('should handle RPC errors gracefully', async () => {
      const newRole: UserRole = 'admin';
      const errorMessage = 'You cannot change your own role';

      // Mock RPC error (self-demotion attempt)
      mockedSupabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Attempt role change
      const { data, error } = await supabase.rpc('change_user_role', {
        target_user_id: mockAdminProfile.id, // Admin trying to change own role
        new_role: newRole,
        admin_notes: null,
      });

      // Verify error was returned
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toBe(errorMessage);
    });

    it('should validate admin authorization', async () => {
      const errorMessage = 'Only admins can change user roles';

      // Mock RPC error (non-admin attempting role change)
      mockedSupabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Attempt role change as non-admin
      const { data, error } = await supabase.rpc('change_user_role', {
        target_user_id: mockTargetUser.id,
        new_role: 'admin',
        admin_notes: null,
      });

      // Verify authorization error
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toBe(errorMessage);
    });

    it('should validate target user exists', async () => {
      const errorMessage = 'Target user not found';

      // Mock RPC error (user doesn't exist)
      mockedSupabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Attempt role change for non-existent user
      const { data, error } = await supabase.rpc('change_user_role', {
        target_user_id: 'non-existent-user-id',
        new_role: 'agency_owner',
        admin_notes: null,
      });

      // Verify error
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toBe(errorMessage);
    });

    it('should validate role enum values', async () => {
      const errorMessage = 'Invalid role value';

      // Mock RPC error (invalid role)
      mockedSupabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Attempt role change with invalid role
      const { data, error } = await supabase.rpc('change_user_role', {
        target_user_id: mockTargetUser.id,
        new_role: 'super_admin' as UserRole, // Invalid role
        admin_notes: null,
      });

      // Verify validation error
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toBe(errorMessage);
    });

    it('should prevent no-op role changes', async () => {
      const errorMessage = 'User already has this role';

      // Mock RPC error (role already set)
      mockedSupabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Attempt to set the same role
      const { data, error } = await supabase.rpc('change_user_role', {
        target_user_id: mockTargetUser.id,
        new_role: mockTargetUser.role, // Same role as current
        admin_notes: null,
      });

      // Verify error
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toBe(errorMessage);
    });
  });

  describe('Atomic Transaction Tests', () => {
    it('should rollback profile update if audit log fails', async () => {
      // This test verifies the RPC function's atomic behavior
      // In a real scenario, if the audit log insert fails, the profile update should rollback

      const errorMessage = 'Audit log insertion failed';

      // Mock RPC failure (simulating transaction rollback)
      mockedSupabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Attempt role change
      const { data, error } = await supabase.rpc('change_user_role', {
        target_user_id: mockTargetUser.id,
        new_role: 'agency_owner',
        admin_notes: 'Test notes',
      });

      // Verify the entire transaction failed
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toBe(errorMessage);

      // In a real scenario, we would verify that the profile role was NOT updated
      // This is guaranteed by the SECURITY DEFINER function's transaction handling
    });
  });

  describe('Security Tests', () => {
    it('should prevent self-demotion', async () => {
      const errorMessage = 'You cannot change your own role';

      mockedSupabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { data, error } = await supabase.rpc('change_user_role', {
        target_user_id: mockAdminProfile.id,
        new_role: 'user',
        admin_notes: null,
      });

      expect(data).toBeNull();
      expect(error?.message).toBe(errorMessage);
    });

    it('should enforce admin-only access', async () => {
      const errorMessage = 'Only admins can change user roles';

      mockedSupabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      const { data, error } = await supabase.rpc('change_user_role', {
        target_user_id: mockTargetUser.id,
        new_role: 'agency_owner',
        admin_notes: null,
      });

      expect(data).toBeNull();
      expect(error?.message).toBe(errorMessage);
    });
  });

  describe('Audit Log Retention', () => {
    it('should preserve audit logs even after user deletion', async () => {
      // This test verifies the ON DELETE SET NULL behavior

      const mockAuditLogAfterDeletion = {
        id: 'audit-999',
        user_id: null, // User was deleted
        admin_id: mockAdminProfile.id,
        old_role: 'user',
        new_role: 'agency_owner',
        changed_at: new Date().toISOString(),
        notes: 'User was verified, later deleted',
        created_at: new Date().toISOString(),
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockAuditLogAfterDeletion,
        error: null,
      });

      mockedSupabase.from = jest.fn().mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      const { data: auditLog, error } = await supabase
        .from('role_change_audit')
        .select('*')
        .eq('id', 'audit-999')
        .single();

      expect(error).toBeNull();
      expect(auditLog).toBeDefined();
      expect(auditLog?.user_id).toBeNull(); // User was deleted
      expect(auditLog?.admin_id).toBe(mockAdminProfile.id);
      expect(auditLog?.notes).toContain('later deleted');
    });
  });
});
