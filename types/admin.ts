/**
 * Admin-specific TypeScript type definitions
 *
 * This file contains types used by admin pages and components
 * for managing agencies, users, and other administrative functions.
 */

/**
 * Agency data as returned by the admin agencies API
 * Includes owner profile information for claimed agencies
 */
export interface AdminAgency {
  /** Unique identifier (UUID) */
  id: string;
  /** Agency business name */
  name: string;
  /** URL-friendly slug for agency profile */
  slug: string;
  /** Whether the agency is active/visible */
  is_active: boolean;
  /** Whether the agency has been claimed by an owner */
  is_claimed: boolean;
  /** User ID of the agency owner (if claimed) */
  claimed_by: string | null;
  /** Creation timestamp */
  created_at: string;
  /** Profile completion percentage (0-100) */
  profile_completion_percentage: number | null;
  /** Owner profile information (populated for claimed agencies) */
  owner_profile?: {
    email: string | null;
    full_name: string | null;
  } | null;
}
