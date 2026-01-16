/**
 * Authentication & Authorization Utilities
 *
 * Placeholder functions for authentication.
 * TODO: Replace with actual authentication provider (Supabase Auth, NextAuth, etc.)
 */

import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  agencyId: string;
  email: string;
}

/**
 * Get authenticated user from request
 *
 * TODO: Replace with actual auth implementation
 * - Check session cookie or Authorization header
 * - Validate JWT token
 * - Return user details from token/session
 *
 * @returns Authenticated user or null if not authenticated
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  // TODO: Implement actual authentication
  // In production, this should:
  // 1. Extract session/token from request
  // 2. Validate JWT token
  // 3. Return user details or null

  // SECURITY: Fail closed - only allow mock auth in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowMockAuth = isDevelopment && process.env.ALLOW_MOCK_AUTH !== 'false';

  if (allowMockAuth) {
    // Mock implementation for development only
    const mockAgencyId = request.headers.get('x-mock-agency-id') || 'agency-1';

    return {
      id: 'user-1',
      agencyId: mockAgencyId,
      email: 'mock@agency.com',
    };
  }

  // In production or when mock auth is disabled, fail closed
  // Return null to require proper authentication
  return null;
}

/**
 * Verify user has access to specific agency
 *
 * @param user Authenticated user
 * @param agencyId Agency ID to check access for
 * @returns True if user has access
 */
export function verifyAgencyAccess(
  user: AuthenticatedUser,
  agencyId: string
): boolean {
  // TODO: Implement proper role-based access control
  // Check if user is member of agency, admin, etc.
  return user.agencyId === agencyId;
}
