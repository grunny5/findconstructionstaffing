import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ConversationThreadClient } from '@/components/messages/ConversationThreadClient';
import type {
  ConversationWithParticipants,
  MessageWithSender,
} from '@/types/api';

interface ConversationPageProps {
  params: {
    id: string;
  };
}

/**
 * Conversation Thread Page (Server Component)
 *
 * Displays a single conversation with message history and real-time updates.
 * Requires authentication - redirects to login if not authenticated.
 *
 * Features:
 * - Fetches conversation and messages from API
 * - Real-time message updates via Supabase Realtime
 * - Message grouping (same sender < 5 min apart)
 * - Auto-scroll to bottom on new messages
 * - Pagination for older messages
 * - Mark conversation as read on view
 */
export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?redirectTo=/messages/conversations/${params.id}`);
  }

  // Fetch user profile to check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  // Fetch conversation and messages
  let conversation: ConversationWithParticipants | null = null;
  let messages: MessageWithSender[] = [];
  let hasMore = false;
  let fetchError: Error | null = null;

  try {
    // Forward authentication cookies to internal API
    const cookieStore = await cookies();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages/conversations/${params.id}?limit=50`,
      {
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieStore.toString(),
        },
        cache: 'no-store', // Always fetch fresh data
      }
    );

    if (response.ok) {
      const data = await response.json();
      conversation = data.data.conversation;
      messages = data.data.messages;
      hasMore = data.data.has_more;
    } else if (response.status === 404) {
      notFound();
    } else {
      fetchError = new Error(
        `Failed to fetch conversation: ${response.statusText}`
      );
    }
  } catch (error) {
    fetchError = error as Error;
  }

  // Log error but don't fail the page - let 404 handle missing conversations
  if (fetchError) {
    console.error('Error fetching conversation:', fetchError);
    notFound();
  }

  // Conversation should exist at this point
  if (!conversation) {
    notFound();
  }

  return (
    <div className="h-screen bg-gray-50">
      <ConversationThreadClient
        initialConversation={conversation}
        initialMessages={messages}
        initialHasMore={hasMore}
        currentUserId={user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
