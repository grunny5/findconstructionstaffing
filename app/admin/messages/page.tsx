import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminMessagesClient } from '@/components/admin/AdminMessagesClient';

/**
 * Admin Messages Page
 *
 * Displays all platform conversations for moderation purposes.
 * Only accessible to users with role = 'admin'.
 */
export default async function AdminMessagesPage() {
  // ========================================================================
  // 1. AUTHENTICATION & AUTHORIZATION
  // ========================================================================
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirectTo=/admin/messages');
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    // Redirect to home with error message (or show 403)
    redirect('/?error=unauthorized');
  }

  // ========================================================================
  // 2. FETCH ALL CONVERSATIONS
  // ========================================================================
  // Admin RLS policies allow admins to see all conversations
  const { data: conversations, error: conversationsError } = await supabase
    .from('conversations')
    .select(
      `
      id,
      context_type,
      context_id,
      last_message_at,
      created_at,
      conversation_participants!inner (
        user_id,
        profiles:user_id (
          id,
          full_name,
          email,
          role
        )
      )
    `
    )
    .order('last_message_at', { ascending: false })
    .limit(100);

  if (conversationsError) {
    console.error('Error fetching conversations:', conversationsError);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          Failed to load conversations. Please try again.
        </div>
      </div>
    );
  }

  // ========================================================================
  // 3. FETCH MESSAGE COUNTS FOR EACH CONVERSATION
  // ========================================================================
  const conversationIds = conversations?.map((c) => c.id) || [];

  const { data: messageCounts } = await supabase
    .from('messages')
    .select('conversation_id, created_at')
    .in('conversation_id', conversationIds)
    .is('deleted_at', null);

  // Calculate message counts and high volume status (10+ messages in 24h)
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const conversationStats = new Map<
    string,
    { totalMessages: number; recentMessages: number }
  >();

  messageCounts?.forEach((msg) => {
    const msgDate = new Date(msg.created_at);
    const stats = conversationStats.get(msg.conversation_id) || {
      totalMessages: 0,
      recentMessages: 0,
    };

    stats.totalMessages++;
    if (msgDate >= oneDayAgo) {
      stats.recentMessages++;
    }

    conversationStats.set(msg.conversation_id, stats);
  });

  // ========================================================================
  // 4. FETCH LAST MESSAGE PREVIEW FOR EACH CONVERSATION
  // ========================================================================
  const { data: lastMessages } = await supabase
    .from('messages')
    .select('conversation_id, content, created_at, deleted_at')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false });

  const lastMessageMap = new Map<
    string,
    { content: string; created_at: string; deleted_at: string | null }
  >();

  lastMessages?.forEach((msg) => {
    if (!lastMessageMap.has(msg.conversation_id)) {
      lastMessageMap.set(msg.conversation_id, {
        content: msg.content,
        created_at: msg.created_at,
        deleted_at: msg.deleted_at,
      });
    }
  });

  // ========================================================================
  // 5. FETCH AGENCY CONTEXT IF APPLICABLE
  // ========================================================================
  const agencyIds =
    conversations
      ?.filter((c) => c.context_type === 'agency_inquiry' && c.context_id)
      .map((c) => c.context_id as string) || [];

  const { data: agencies } = await supabase
    .from('agencies')
    .select('id, name, slug')
    .in('id', agencyIds);

  const agencyMap = new Map(agencies?.map((a) => [a.id, a]) || []);

  // ========================================================================
  // 6. TRANSFORM DATA FOR CLIENT
  // ========================================================================
  const transformedConversations = conversations?.map((conv) => {
    const stats = conversationStats.get(conv.id) || {
      totalMessages: 0,
      recentMessages: 0,
    };
    const lastMessage = lastMessageMap.get(conv.id);
    const agency =
      conv.context_type === 'agency_inquiry' && conv.context_id
        ? agencyMap.get(conv.context_id)
        : null;

    return {
      id: conv.id,
      context_type: conv.context_type,
      context_agency: agency
        ? { id: agency.id, name: agency.name, slug: agency.slug }
        : null,
      participants: conv.conversation_participants.map((p: any) => ({
        id: p.profiles.id,
        full_name: p.profiles.full_name || 'Unknown',
        email: p.profiles.email,
        role: p.profiles.role,
      })),
      total_messages: stats.totalMessages,
      recent_messages_24h: stats.recentMessages,
      last_message_preview: lastMessage?.deleted_at
        ? '(This message was deleted)'
        : lastMessage?.content.substring(0, 100) || '',
      last_message_at: conv.last_message_at,
      created_at: conv.created_at,
      is_high_volume: stats.recentMessages >= 10,
    };
  });

  // ========================================================================
  // 7. RENDER CLIENT COMPONENT
  // ========================================================================
  return (
    <div className="container mx-auto px-4 py-8">
      <AdminMessagesClient conversations={transformedConversations || []} />
    </div>
  );
}
