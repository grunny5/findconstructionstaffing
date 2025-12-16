import type { UserRole } from '@/types/database';

/**
 * Get display name for a user role
 */
export const roleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'agency_owner':
      return 'Agency Owner';
    default:
      return 'User';
  }
};

/**
 * Get badge variant for a user role
 */
export const roleBadgeVariant = (
  role: UserRole
): 'default' | 'secondary' | 'destructive' => {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'agency_owner':
      return 'default';
    default:
      return 'secondary';
  }
};
