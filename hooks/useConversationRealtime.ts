/**
 * useConversationRealtime Hook
 *
 * React hook for subscribing to real-time message updates in a conversation via Supabase Realtime.
 *
 * Features:
 * - Subscribes to INSERT and UPDATE events on messages table
 * - Filters by conversation_id
 * - Auto-cleanup on unmount (prevents memory leaks)
 * - TypeScript typed for Message payloads
 *
 * Usage:
 * ```tsx
 * function MessageThread({ conversationId }: { conversationId: string }) {
 *   const [messages, setMessages] = useState<Message[]>([]);
 *
 *   useConversationRealtime(conversationId, (newMessage) => {
 *     setMessages(prev => [...prev, newMessage]);
 *   });
 *
 *   return <div>{messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}</div>;
 * }
 * ```
 */

'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Message type matching database schema
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

/**
 * Callback function type for message events
 */
export type MessageCallback = (message: Message) => void;

/**
 * Subscribe to real-time updates for a conversation's messages
 *
 * This hook establishes a Supabase Realtime subscription that listens for:
 * - INSERT events: New messages sent to the conversation
 * - UPDATE events: Messages edited or deleted
 *
 * The subscription is automatically cleaned up when the component unmounts
 * or when the conversationId changes.
 *
 * @param conversationId - UUID of the conversation to subscribe to
 * @param onMessage - Callback function invoked when a message event occurs
 *
 * @example
 * ```tsx
 * const [messages, setMessages] = useState<Message[]>([]);
 *
 * useConversationRealtime(conversationId, (newMessage) => {
 *   // Handle INSERT: Add new message
 *   if (!messages.find(m => m.id === newMessage.id)) {
 *     setMessages(prev => [...prev, newMessage]);
 *   }
 *   // Handle UPDATE: Update existing message
 *   else {
 *     setMessages(prev => prev.map(m =>
 *       m.id === newMessage.id ? newMessage : m
 *     ));
 *   }
 * });
 * ```
 */
export function useConversationRealtime(
  conversationId: string,
  onMessage: MessageCallback
): void {
  useEffect(() => {
    // Skip subscription if no conversationId provided
    if (!conversationId) {
      return;
    }

    const supabase = createClient();
    let channel: RealtimeChannel;

    try {
      // Create a channel for this conversation
      channel = supabase.channel(`conversation:${conversationId}`);

      // Subscribe to INSERT events (new messages)
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Invoke callback with the new message
          onMessage(payload.new as Message);
        }
      );

      // Subscribe to UPDATE events (edited/deleted messages)
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Invoke callback with the updated message
          onMessage(payload.new as Message);
        }
      );

      // Subscribe to the channel
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime: Subscribed to conversation ${conversationId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(
            `Realtime: Error subscribing to conversation ${conversationId}`
          );
        } else if (status === 'TIMED_OUT') {
          console.warn(
            `Realtime: Subscription timeout for conversation ${conversationId}`
          );
        }
      });
    } catch (error) {
      console.error('Realtime: Failed to set up subscription:', error);
    }

    // Cleanup function: Remove channel on unmount or conversationId change
    return () => {
      if (channel) {
        supabase
          .removeChannel(channel)
          .then(() => {
            console.log(
              `Realtime: Unsubscribed from conversation ${conversationId}`
            );
          })
          .catch((error) => {
            console.error('Realtime: Error removing channel:', error);
          });
      }
    };
  }, [conversationId, onMessage]);

  // Hook has side effects only, no return value
}
