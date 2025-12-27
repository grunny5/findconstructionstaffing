'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationHeader } from './ConversationHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowLeft } from 'lucide-react';
import { useConversationRealtime } from '@/hooks/useConversationRealtime';
import type {
  ConversationWithParticipants,
  MessageWithSender,
} from '@/types/api';

interface ConversationThreadClientProps {
  initialConversation: ConversationWithParticipants;
  initialMessages: MessageWithSender[];
  initialHasMore: boolean;
  currentUserId: string;
}

/**
 * Groups messages by sender and time proximity
 * Messages from same sender within 5 minutes are grouped
 */
function groupMessages(messages: MessageWithSender[]): MessageWithSender[][] {
  if (messages.length === 0) return [];

  const groups: MessageWithSender[][] = [];
  let currentGroup: MessageWithSender[] = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const currentMsg = messages[i];
    const previousMsg = messages[i - 1];

    const sameSender = currentMsg.sender_id === previousMsg.sender_id;
    const timeDiff =
      new Date(currentMsg.created_at).getTime() -
      new Date(previousMsg.created_at).getTime();
    const within5Minutes = timeDiff < 5 * 60 * 1000; // 5 minutes in milliseconds

    if (sameSender && within5Minutes) {
      currentGroup.push(currentMsg);
    } else {
      groups.push(currentGroup);
      currentGroup = [currentMsg];
    }
  }

  // Push the last group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Client component for conversation thread view
 * Handles real-time updates, message sending, and UI interactions
 */
export function ConversationThreadClient({
  initialConversation,
  initialMessages,
  initialHasMore,
  currentUserId,
}: ConversationThreadClientProps) {
  const router = useRouter();
  const [messages, setMessages] =
    useState<MessageWithSender[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowNewMessageButton(false);
    setIsNearBottom(true);
  }, []);

  // Auto-scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Check if user is near bottom of scroll area
  const handleScroll = useCallback(() => {
    const scrollContainer = scrollAreaRef.current;
    if (!scrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const nearBottom = distanceFromBottom < 100; // Within 100px of bottom

    setIsNearBottom(nearBottom);
    if (nearBottom) {
      setShowNewMessageButton(false);
    }
  }, []);

  // Handle new messages from real-time subscription
  const handleNewMessage = useCallback(
    (message: {
      id: string;
      conversation_id: string;
      sender_id: string;
      content: string;
      created_at: string;
      edited_at: string | null;
      deleted_at: string | null;
    }) => {
      // Construct MessageWithSender from realtime message
      const sender = initialConversation.participants.find(
        (p) => p.id === message.sender_id
      );

      if (!sender) {
        console.error('Sender not found in participants:', message.sender_id);
        return;
      }

      const fullMessage: MessageWithSender = {
        ...message,
        sender_id: message.sender_id,
        sender: {
          id: sender.id,
          full_name: sender.full_name || 'Unknown User',
          email: sender.email || '',
        },
      };

      setMessages((prev) => {
        // Check if message already exists (prevent duplicates)
        if (prev.some((m) => m.id === fullMessage.id)) {
          return prev;
        }
        return [...prev, fullMessage];
      });

      // Auto-scroll if user is near bottom
      if (isNearBottom) {
        setTimeout(() => scrollToBottom('smooth'), 100);
      } else {
        setShowNewMessageButton(true);
      }
    },
    [isNearBottom, scrollToBottom, initialConversation.participants]
  );

  // Subscribe to real-time updates
  useConversationRealtime(initialConversation.id, handleNewMessage);

  // Load earlier messages
  const loadEarlierMessages = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const response = await fetch(
        `/api/messages/conversations/${initialConversation.id}?limit=50&before=${oldestMessage.id}`
      );

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...data.data.messages, ...prev]);
        setHasMore(data.data.has_more);
      }
    } catch (error) {
      console.error('Failed to load earlier messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Send message
  const handleSendMessage = async (content: string) => {
    if (isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(
        `/api/messages/conversations/${initialConversation.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Message will be added via real-time subscription
        // But add immediately for better UX
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.data.id)) {
            return prev;
          }
          return [...prev, data.data];
        });
        scrollToBottom('smooth');
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Mark conversation as read on mount
  useEffect(() => {
    fetch(`/api/messages/conversations/${initialConversation.id}/read`, {
      method: 'PUT',
    }).catch((error) => {
      console.error('Failed to mark conversation as read:', error);
    });
  }, [initialConversation.id]);

  // Group messages for display
  const messageGroups = groupMessages(messages);

  // Transform conversation data for ConversationHeader
  const conversationForHeader = {
    id: initialConversation.id,
    context_type: initialConversation.context_type,
    context_agency: initialConversation.agency_name
      ? {
          id: initialConversation.context_id || '',
          name: initialConversation.agency_name,
          slug: '', // Not available in this context
        }
      : null,
    participants: initialConversation.participants.map((p) => ({
      user_id: p.id,
      user: {
        id: p.id,
        name: p.full_name || 'Unknown User',
        avatar_url: null,
        role: null,
      },
    })),
    created_at: initialConversation.created_at,
  };

  return (
    <div className="flex h-full flex-col">
      {/* Mobile back button + Header */}
      <div className="border-b border-gray-200 bg-white md:hidden">
        <ConversationHeader
          conversation={conversationForHeader}
          currentUserId={currentUserId}
          onBack={() => router.push('/messages')}
        />
      </div>
      {/* Desktop Header */}
      <div className="hidden border-b border-gray-200 bg-white md:block">
        <ConversationHeader
          conversation={conversationForHeader}
          currentUserId={currentUserId}
        />
      </div>

      {/* Messages area */}
      <ScrollArea
        className="flex-1 p-4"
        ref={scrollAreaRef}
        onScroll={handleScroll}
      >
        {/* Load earlier messages button */}
        {hasMore && (
          <div className="mb-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={loadEarlierMessages}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Loading...' : 'Load Earlier Messages'}
            </Button>
          </div>
        )}

        {/* Message groups */}
        <div className="space-y-4">
          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-1">
              {group.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={{
                    id: message.id,
                    content: message.content,
                    created_at: message.created_at,
                    edited_at: message.edited_at,
                    deleted_at: message.deleted_at,
                  }}
                  sender={{
                    id: message.sender.id,
                    name: message.sender.full_name || 'Unknown User',
                    avatar_url: null,
                  }}
                  isOwnMessage={message.sender_id === currentUserId}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* New message button (when scrolled up) */}
      {showNewMessageButton && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <Button
            variant="default"
            size="sm"
            onClick={() => scrollToBottom('smooth')}
            className="shadow-lg"
          >
            <ArrowDown className="mr-2 h-4 w-4" />
            New message
          </Button>
        </div>
      )}

      {/* Message input */}
      <MessageInput
        conversationId={initialConversation.id}
        onSend={handleSendMessage}
        disabled={isSending}
      />
    </div>
  );
}
