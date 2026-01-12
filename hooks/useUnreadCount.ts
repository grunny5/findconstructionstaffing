/**
 * useUnreadCount Hook
 *
 * Fetches and manages unread message count for authenticated users.
 *
 * Features:
 * - Fetches initial count on mount
 * - Polls for updates every 30 seconds
 * - Returns count and loading state
 * - Cleans up on unmount
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchWithTimeout,
  TIMEOUT_CONFIG,
  TimeoutError,
} from '@/lib/fetch/timeout';

export interface UnreadCountData {
  total_unread: number;
  conversations_with_unread: number;
}

export interface UseUnreadCountReturn {
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUnreadCount(
  enabled: boolean = true,
  pollInterval: number = 30000 // 30 seconds
): UseUnreadCountReturn {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetchWithTimeout('/api/messages/unread-count', {
        timeout: TIMEOUT_CONFIG.CLIENT_POLL,
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.total_unread);
        setError(null);
      } else if (response.status === 401) {
        // User not authenticated - set count to 0
        setUnreadCount(0);
        setError(null);
      } else {
        setError('Failed to fetch unread count');
      }
    } catch (err) {
      if (err instanceof TimeoutError) {
        // Graceful degradation: Keep previous count, don't block UI
        console.warn('Unread count fetch timed out');
        setError(null); // Don't show error to user for background polling
      } else {
        setError('Network error');
        console.error('Error fetching unread count:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Polling
  useEffect(() => {
    if (!enabled || pollInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [enabled, pollInterval, fetchUnreadCount]);

  return {
    unreadCount,
    isLoading,
    error,
    refetch: fetchUnreadCount,
  };
}
