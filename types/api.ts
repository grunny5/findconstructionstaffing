/**
 * API TypeScript Type Definitions
 *
 * This file contains comprehensive type definitions for the agencies API endpoint.
 * All types are designed to match the database schema exactly while providing
 * type safety for API consumers.
 */

import type { ClaimStatus } from './database';

/**
 * Represents a trade specialty that agencies can offer
 */
export interface Trade {
  /** Unique identifier for the trade */
  id: string;
  /** Display name of the trade (e.g., "Electricians") */
  name: string;
  /** URL-friendly slug for the trade (e.g., "electricians") */
  slug: string;
  /** Optional description of the trade */
  description?: string | null;
}

/**
 * Represents a geographic region where agencies operate
 */
export interface Region {
  /** Unique identifier for the region */
  id: string;
  /** Display name of the region (e.g., "Texas") */
  name: string;
  /** Two-letter state code (e.g., "TX") */
  code: string;
}

/**
 * Complete agency entity matching database schema
 */
export interface Agency {
  /** Unique identifier (UUID) */
  id: string;
  /** Agency business name */
  name: string;
  /** URL-friendly slug for agency profile */
  slug: string;
  /** Agency description or overview */
  description: string | null;
  /** URL to agency logo image */
  logo_url: string | null;
  /** Agency website URL */
  website: string | null;
  /** Contact phone number */
  phone: string | null;
  /** Contact email address */
  email: string | null;
  /** Whether the agency has claimed their profile */
  is_claimed: boolean;
  /** Whether the agency offers per diem */
  offers_per_diem: boolean;
  /** Whether the agency works with unions */
  is_union: boolean;
  /** Year the agency was founded */
  founded_year: number | null;
  /** Size category of the agency (e.g., "10-50", "50-100") */
  employee_count: string | null;
  /** Location of agency headquarters */
  headquarters: string | null;
  /** Average rating (0-10) */
  rating: number | null;
  /** Total number of reviews */
  review_count: number;
  /** Total number of completed projects */
  project_count: number;
  /** Whether the agency is verified by platform */
  verified: boolean;
  /** Whether the agency is featured */
  featured: boolean;
  /** Profile completion percentage (0-100%) */
  profile_completion_percentage: number;
  /** Timestamp of last profile edit */
  last_edited_at: string | null;
  /** User ID who last edited the profile */
  last_edited_by: string | null;
  /** Associated trade specialties */
  trades: Trade[];
  /** Associated service regions */
  regions: Region[];
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMetadata {
  /** Total number of records matching the query */
  total: number;
  /** Number of records per page */
  limit: number;
  /** Starting position in the result set */
  offset: number;
  /** Whether more records exist beyond this page */
  hasMore: boolean;
  /** Current page number (1-indexed) - optional for APIs that don't use page-based pagination */
  page?: number;
  /** Total number of pages - optional for APIs that don't use page-based pagination */
  totalPages?: number;
}

/**
 * Standard API response format for agency listings
 */
export interface AgenciesApiResponse {
  /** Array of agency records */
  data: Agency[];
  /** Pagination information */
  pagination: PaginationMetadata;
}

/**
 * Query parameters for the agencies endpoint
 */
export interface AgenciesQueryParams {
  /** Search term for name/description */
  search?: string;
  /** Filter by trade slugs */
  trades?: string[];
  /** Filter by state codes */
  states?: string[];
  /** Results per page (default: 20, max: 100) */
  limit?: number;
  /** Pagination offset (default: 0) */
  offset?: number;
}

/**
 * Standard error response format
 */
export interface ApiError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details (optional) */
  details?: Record<string, any>;
}

/**
 * Error response wrapper
 */
export interface ErrorResponse {
  error: ApiError;
}

/**
 * Single agency response
 */
export interface AgencyResponse {
  data: Agency;
}

/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse(response: any): response is ErrorResponse {
  return (
    response !== null &&
    response !== undefined &&
    typeof response === 'object' &&
    'error' in response
  );
}

/**
 * Constants for API endpoint configuration
 */
export const API_CONSTANTS = {
  /** Default number of results per page */
  DEFAULT_LIMIT: 20,
  /** Maximum allowed results per page */
  MAX_LIMIT: 100,
  /** Default pagination offset */
  DEFAULT_OFFSET: 0,
  /** Cache duration in seconds (5 minutes) */
  CACHE_MAX_AGE: 300,
  /** Maximum number of trade filters allowed in a single request */
  MAX_TRADE_FILTERS: 10,
  /** Maximum number of state filters allowed in a single request */
  MAX_STATE_FILTERS: 10,
} as const;

/**
 * HTTP status codes used by the API
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error codes for consistent error handling
 */
export const ERROR_CODES = {
  INVALID_PARAMS: 'INVALID_PARAMS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  AGENCY_NOT_FOUND: 'AGENCY_NOT_FOUND',
  AGENCY_ALREADY_CLAIMED: 'AGENCY_ALREADY_CLAIMED',
  PENDING_CLAIM_EXISTS: 'PENDING_CLAIM_EXISTS',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * User profile information for claim requests
 */
export interface ClaimUser {
  /** User's unique identifier */
  id: string;
  /** User's full name */
  full_name: string | null;
  /** User's email address */
  email: string;
}

/**
 * Agency information for claim requests
 */
export interface ClaimAgency {
  /** Agency's unique identifier */
  id: string;
  /** Agency name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** Agency logo URL */
  logo_url: string | null;
  /** Agency website URL */
  website: string | null;
}

/**
 * Agency claim request with complete related data
 */
export interface ClaimRequest {
  /** Claim request unique identifier */
  id: string;
  /** Agency being claimed */
  agency_id: string;
  /** User requesting the claim */
  user_id: string;
  /** Current status of the claim */
  status: ClaimStatus;
  /** Business email of the requester */
  business_email: string;
  /** Phone number (optional) */
  phone_number: string | null;
  /** Job title or position */
  position_title: string;
  /** Verification method used */
  verification_method: 'email' | 'phone' | 'manual';
  /** Whether email domain matches agency website */
  email_domain_verified: boolean;
  /** Additional notes from requester */
  additional_notes: string | null;
  /** Rejection reason (if rejected) */
  rejection_reason: string | null;
  /** Admin who reviewed (if reviewed) */
  reviewed_by: string | null;
  /** Review timestamp (if reviewed) */
  reviewed_at: string | null;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Related agency data */
  agency: ClaimAgency;
  /** Related user data */
  user: ClaimUser;
}

/**
 * API response for claims list
 */
export interface ClaimsApiResponse {
  /** Array of claim requests */
  data: ClaimRequest[];
  /** Pagination metadata */
  pagination: PaginationMetadata;
}

/**
 * Messaging API Types (Feature #009)
 * Provides type-safe interfaces for the direct messaging system
 */

/**
 * Participant profile information in conversations
 */
export interface ConversationParticipantProfile {
  /** User's unique identifier */
  id: string;
  /** User's full name */
  full_name: string | null;
  /** User's email address */
  email: string;
}

/**
 * Conversation with participant information and unread count
 */
export interface ConversationWithParticipants {
  /** Unique conversation identifier */
  id: string;
  /** Type of conversation: agency_inquiry or general */
  context_type: 'agency_inquiry' | 'general';
  /** Agency ID if context_type is agency_inquiry */
  context_id: string | null;
  /** Timestamp of last message in conversation */
  last_message_at: string;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Array of participants in this conversation */
  participants: ConversationParticipantProfile[];
  /** Preview of last message */
  last_message_preview: string | null;
  /** Number of unread messages for current user */
  unread_count: number;
  /** Agency name if context_type is agency_inquiry */
  agency_name?: string | null;
}

/**
 * Message with sender information
 */
export interface MessageWithSender {
  /** Unique message identifier */
  id: string;
  /** Conversation this message belongs to */
  conversation_id: string;
  /** ID of user who sent the message */
  sender_id: string;
  /** Message content */
  content: string;
  /** Creation timestamp */
  created_at: string;
  /** Edit timestamp (null if never edited) */
  edited_at: string | null;
  /** Soft-delete timestamp (null if not deleted) */
  deleted_at: string | null;
  /** Sender's profile information */
  sender: ConversationParticipantProfile;
}

/**
 * Conversation detail with messages and participants
 */
export interface ConversationDetailResponse {
  /** Conversation metadata */
  conversation: ConversationWithParticipants;
  /** Array of messages in the conversation */
  messages: MessageWithSender[];
  /** Pagination metadata for messages */
  pagination: PaginationMetadata;
}

/**
 * API response for conversations list
 */
export interface ConversationsApiResponse {
  /** Array of conversations with participants */
  data: ConversationWithParticipants[];
  /** Pagination metadata */
  pagination: PaginationMetadata;
}

/**
 * Single conversation response
 */
export interface ConversationResponse {
  data: ConversationWithParticipants;
}

/**
 * Single message response
 */
export interface MessageResponse {
  data: MessageWithSender;
}

/**
 * Unread message count response
 */
export interface UnreadCountResponse {
  /** Total number of unread messages across all conversations */
  unread_count: number;
  /** Number of conversations with unread messages */
  unread_conversations: number;
}

// =============================================================================
// ROUTE CONTEXT TYPES
// =============================================================================

/**
 * Generic route context for Next.js 15 async params
 *
 * In Next.js 15+, dynamic route params are async and must be awaited.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route#context-optional
 *
 * @example
 * ```typescript
 * type RouteContext = AsyncRouteContext<{ id: string }>;
 *
 * export async function GET(req: NextRequest, context: RouteContext) {
 *   const { id } = await context.params;
 *   // ...
 * }
 * ```
 */
export type AsyncRouteContext<T extends Record<string, string>> = {
  params: Promise<T>;
};

/**
 * Generic route context for Next.js 14 sync params
 *
 * In Next.js 14 and earlier, dynamic route params are synchronous.
 *
 * @example
 * ```typescript
 * type RouteContext = SyncRouteContext<{ id: string }>;
 *
 * export async function GET(req: NextRequest, context: RouteContext) {
 *   const { id } = context.params;
 *   // ...
 * }
 * ```
 */
export type SyncRouteContext<T extends Record<string, string>> = {
  params: T;
};
