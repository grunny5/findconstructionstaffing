/**
 * ConversationListItem Component
 *
 * Displays a conversation preview in the inbox sidebar
 *
 * Features:
 * - Other participant's avatar and name
 * - Last message preview (truncated to 60 chars)
 * - Relative timestamp ("2h ago", "Yesterday", "Dec 20")
 * - Unread badge with count
 * - Context icon for agency inquiries
 * - Hover and active states
 * - Keyboard navigation support
 * - Responsive design
 */

'use client';

import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeMessagePreview } from '@/lib/utils/sanitize';

export interface ConversationListItemProps {
  conversation: {
    id: string;
    context_type: 'agency_inquiry' | 'general';
    last_message?: {
      content: string;
      created_at: string;
    } | null;
    participants: Array<{
      user_id: string;
      user: {
        id: string;
        name: string;
        avatar_url?: string | null;
      };
    }>;
    unread_count?: number;
  };
  currentUserId: string;
  isActive?: boolean;
  onClick: (conversationId: string) => void;
}

/**
 * Get initials from a name (first letter of first and last name)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format timestamp based on recency
 * - Today: "2h ago"
 * - Yesterday: "Yesterday"
 * - Older: "Dec 20"
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  return format(date, 'MMM d');
}

export function ConversationListItem({
  conversation,
  currentUserId,
  isActive = false,
  onClick,
}: ConversationListItemProps) {
  // Find the other participant (not the current user)
  const otherParticipant = conversation.participants.find(
    (p) => p.user_id !== currentUserId
  );

  if (!otherParticipant) {
    return null;
  }

  const { user } = otherParticipant;
  const hasUnread = (conversation.unread_count ?? 0) > 0;
  const isAgencyInquiry = conversation.context_type === 'agency_inquiry';

  // Get last message preview
  const lastMessagePreview = conversation.last_message?.content
    ? sanitizeMessagePreview(conversation.last_message.content, 60)
    : 'No messages yet';

  // Format timestamp
  const timestamp = conversation.last_message?.created_at
    ? formatTimestamp(conversation.last_message.created_at)
    : '';

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex cursor-pointer gap-3 rounded-lg p-3 transition-colors',
        'hover:bg-accent focus:bg-accent focus:outline-none',
        isActive && 'bg-accent',
        hasUnread && 'bg-muted'
      )}
      onClick={() => onClick(conversation.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(conversation.id);
        }
      }}
      aria-label={`Conversation with ${user.name}${hasUnread ? `, ${conversation.unread_count} unread` : ''}`}
      data-testid="conversation-list-item"
    >
      {/* Avatar */}
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Header: Name + Timestamp */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'truncate text-sm font-medium',
                hasUnread && 'font-semibold'
              )}
            >
              {user.name}
            </span>
            {isAgencyInquiry && (
              <Building2
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-label="Agency inquiry"
              />
            )}
          </div>
          {timestamp && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {timestamp}
            </span>
          )}
        </div>

        {/* Last Message + Unread Badge */}
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'truncate text-sm text-muted-foreground',
              hasUnread && 'font-medium text-foreground'
            )}
          >
            {lastMessagePreview}
          </p>
          {hasUnread && (
            <Badge
              variant="default"
              className="h-5 min-w-[20px] shrink-0 px-1.5 text-xs"
            >
              {conversation.unread_count! > 9
                ? '9+'
                : conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
