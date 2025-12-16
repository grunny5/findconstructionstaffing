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
    case 'user':
      return 'User';
  }
};

/**
 * Get badge variant for a user role
 * Note: 'destructive' (red) for admin is intentional - visually highlights elevated privileges
 */
export const roleBadgeVariant = (
  role: UserRole
): 'default' | 'secondary' | 'destructive' => {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'agency_owner':
      return 'default';
    case 'user':
      return 'secondary';
  }
};
