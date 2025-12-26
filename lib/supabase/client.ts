/**
 * Supabase Client for Client Components
 *
 * This file creates a Supabase client for use in Client Components (React hooks, components with 'use client').
 * For Server Components and API routes, use @/lib/supabase/server instead.
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for client-side use
 *
 * This client is used in:
 * - Client Components (with 'use client' directive)
 * - React hooks
 * - Client-side data fetching
 * - Realtime subscriptions
 *
 * Features:
 * - Cookie-based auth (automatically synced)
 * - Realtime subscriptions
 * - Client-side queries
 *
 * @returns Supabase browser client instance
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
