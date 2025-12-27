'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationListItem } from './ConversationListItem';
import type { ConversationListItemProps } from './ConversationListItem';
import { UnreadBadge } from './UnreadBadge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MessageSquare } from 'lucide-react';
import type { ConversationWithParticipants } from '@/types/api';

interface MessagesInboxClientProps {
  initialConversations: ConversationWithParticipants[];
  currentUserId: string;
}

/**
 * Transform API conversation to ConversationListItem format
 */
function transformConversation(
  conv: ConversationWithParticipants
): ConversationListItemProps['conversation'] {
  return {
    id: conv.id,
    context_type: conv.context_type,
    last_message: conv.last_message_preview
      ? {
          content: conv.last_message_preview,
          created_at: conv.last_message_at,
        }
      : null,
    participants: conv.participants.map((p) => ({
      user_id: p.id,
      user: {
        id: p.id,
        name: p.full_name || 'Unknown User',
        avatar_url: null,
      },
    })),
    unread_count: conv.unread_count,
  };
}

/**
 * Client component for messages inbox
 * Handles filtering, search, and navigation
 */
export function MessagesInboxClient({
  initialConversations,
  currentUserId,
}: MessagesInboxClientProps) {
  const router = useRouter();
  const [conversations] =
    useState<ConversationWithParticipants[]>(initialConversations);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter conversations based on tab and search
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter by unread if needed
    if (filter === 'unread') {
      filtered = filtered.filter((conv) => conv.unread_count > 0);
    }

    // Filter by search term (participant name)
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter((conv) =>
        conv.participants.some((p) =>
          p.full_name?.toLowerCase().includes(searchLower)
        )
      );
    }

    return filtered;
  }, [conversations, filter, search]);

  // Calculate counts for tabs
  const allCount = conversations.length;
  const unreadCount = conversations.filter((c) => c.unread_count > 0).length;

  // Handle conversation click
  const handleConversationClick = (conversationId: string) => {
    setSelectedId(conversationId);
    // On mobile, navigate to conversation page
    if (window.innerWidth < 1024) {
      router.push(`/messages/conversations/${conversationId}`);
    }
    // On desktop, we'll show it in the main panel (future implementation)
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Conversation List */}
      <div className="w-full lg:w-96 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
            Messages
          </h2>
        </div>

        {/* Tabs */}
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as 'all' | 'unread')}
          className="px-4 pt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              {allCount > 0 && (
                <span className="ml-1 text-xs text-gray-500">({allCount})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              Unread
              {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search conversations by participant name"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <MessageSquare
                className="h-12 w-12 text-gray-300 mb-3"
                aria-hidden="true"
              />
              <p className="text-gray-600 font-medium mb-1">
                {search.trim()
                  ? 'No conversations found'
                  : filter === 'unread'
                    ? 'No unread messages'
                    : 'No messages yet'}
              </p>
              <p className="text-sm text-gray-500">
                {!search.trim() && filter === 'all' && (
                  <>Visit an agency profile to start a conversation.</>
                )}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conversation) => (
                <ConversationListItem
                  key={conversation.id}
                  conversation={transformConversation(conversation)}
                  currentUserId={currentUserId}
                  isActive={selectedId === conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Panel - Desktop Only */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
        {selectedId ? (
          <div className="text-center text-gray-500">
            <MessageSquare
              className="h-16 w-16 mx-auto mb-4 text-gray-300"
              aria-hidden="true"
            />
            <p className="text-lg font-medium mb-2">
              Conversation view coming soon
            </p>
            <p className="text-sm">
              Click a conversation to view messages here
            </p>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <MessageSquare
              className="h-16 w-16 mx-auto mb-4 text-gray-300"
              aria-hidden="true"
            />
            <p className="text-lg font-medium mb-2">No conversation selected</p>
            <p className="text-sm">
              Select a conversation from the sidebar to view messages
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
