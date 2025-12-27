import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MessagesInboxClient } from '@/components/messages/MessagesInboxClient';
import type { ConversationWithParticipants } from '@/types/api';

/**
 * Messages Inbox Page (Server Component)
 *
 * Displays user's message conversations with filtering, search, and navigation.
 * Requires authentication - redirects to login if not authenticated.
 *
 * Features:
 * - Fetches initial conversations from API
 * - Responsive layout: sidebar + panel (desktop), full-screen list (mobile)
 * - Tabs for "All" and "Unread" conversations
 * - Search by participant name
 * - Empty state for new users
 */
export default async function MessagesPage() {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirectTo=/messages');
  }

  // Fetch conversations
  let conversations: ConversationWithParticipants[] = [];
  let fetchError: Error | null = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages/conversations?limit=50`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fetch fresh data
      }
    );

    if (response.ok) {
      const data = await response.json();
      conversations = data.data || [];
    } else {
      fetchError = new Error(
        `Failed to fetch conversations: ${response.statusText}`
      );
    }
  } catch (error) {
    fetchError = error as Error;
  }

  // Log error but don't fail the page - show empty state instead
  if (fetchError) {
    console.error('Error fetching conversations:', fetchError);
  }

  return (
    <div className="h-screen bg-gray-50">
      <MessagesInboxClient
        initialConversations={conversations}
        currentUserId={user.id}
      />
    </div>
  );
}
