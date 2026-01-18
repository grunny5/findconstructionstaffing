/**
 * useNewRequestsRealtime Hook
 *
 * React hook for subscribing to real-time new labor request notifications via Supabase Realtime.
 *
 * Features:
 * - Subscribes to INSERT events on labor_request_notifications table
 * - Filters by agency_id
 * - Auto-cleanup on unmount (prevents memory leaks)
 * - TypeScript typed for notification payloads
 *
 * Usage:
 * ```tsx
 * function DashboardLayout({ agencyId }: { agencyId: string }) {
 *   const [newCount, setNewCount] = useState(0);
 *
 *   useNewRequestsRealtime(agencyId, (notification) => {
 *     setNewCount(prev => prev + 1);
 *     toast.success('New labor request received!', {
 *       description: `Request ID: ${notification.id}`,
 *     });
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Notification payload from Supabase Realtime
 */
export interface NewRequestNotification {
  id: string;
  agency_id: string;
  labor_request_id: string;
  craft_id: string;
  status: string;
  created_at: string;
}

/**
 * Callback function type for new request events
 */
export type NewRequestCallback = (notification: NewRequestNotification) => void;

/**
 * Subscribe to real-time new labor request notifications for an agency
 *
 * This hook establishes a Supabase Realtime subscription that listens for
 * INSERT events on the labor_request_notifications table filtered by agency_id.
 *
 * The subscription is automatically cleaned up when the component unmounts
 * or when the agencyId changes.
 *
 * @param agencyId - UUID of the agency to subscribe to
 * @param onNewRequest - Callback function invoked when a new request notification arrives
 *
 * @example
 * ```tsx
 * useNewRequestsRealtime(agencyId, (notification) => {
 *   // Handle new request
 *   setRequests(prev => [notification, ...prev]);
 *   toast.success('New labor request received!');
 * });
 * ```
 */
export function useNewRequestsRealtime(
  agencyId: string | undefined,
  onNewRequest: NewRequestCallback
): void {
  // Store callback in ref to avoid re-subscriptions when it changes
  const onNewRequestRef = useRef(onNewRequest);

  // Store Supabase client in ref to avoid creating multiple connections
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  // Lazily initialize the Supabase client (singleton per component instance)
  const getSupabaseClient = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, []);

  // Update ref when callback changes
  useEffect(() => {
    onNewRequestRef.current = onNewRequest;
  }, [onNewRequest]);

  // Memoize the callback to use in subscription
  const handleNewRequest = useCallback((payload: any) => {
    onNewRequestRef.current(payload.new as NewRequestNotification);
  }, []);

  useEffect(() => {
    // Skip subscription if no agencyId provided
    if (!agencyId) {
      return;
    }

    const supabase = getSupabaseClient();
    let channel: RealtimeChannel;

    try {
      // Create a channel for this agency's request notifications
      channel = supabase.channel(`agency-requests:${agencyId}`);

      // Subscribe to INSERT events (new notifications)
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'labor_request_notifications',
          filter: `agency_id=eq.${agencyId}`,
        },
        handleNewRequest
      );

      // Subscribe to the channel
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime: Subscribed to agency requests ${agencyId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(
            `Realtime: Error subscribing to agency requests ${agencyId}`
          );
        } else if (status === 'TIMED_OUT') {
          console.warn(
            `Realtime: Subscription timeout for agency requests ${agencyId}`
          );
        }
      });
    } catch (error) {
      console.error('Realtime: Failed to set up subscription:', error);
    }

    // Cleanup function: Remove channel on unmount or agencyId change
    return () => {
      if (channel) {
        supabase
          .removeChannel(channel)
          .then(() => {
            console.log(
              `Realtime: Unsubscribed from agency requests ${agencyId}`
            );
          })
          .catch((error) => {
            console.error('Realtime: Error removing channel:', error);
          });
      }
    };
  }, [agencyId, handleNewRequest, getSupabaseClient]);

  // Hook has side effects only, no return value
}
