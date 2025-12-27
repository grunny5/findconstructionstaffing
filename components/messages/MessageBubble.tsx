/**
 * MessageBubble Component
 *
 * Displays an individual message in a conversation thread
 *
 * Features:
 * - Different styling for own vs other messages
 * - Avatar and sender name
 * - Relative timestamps ("2h ago")
 * - Edit/Delete actions for own messages
 * - Edited and deleted message states
 * - Mobile-responsive design
 * - WCAG 2.1 AA compliant
 */

'use client';

import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeMessageContent } from '@/lib/utils/sanitize';

export interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    created_at: string;
    edited_at: string | null;
    deleted_at: string | null;
  };
  sender: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
  isOwnMessage: boolean;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
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
 * Check if edit action should be available (within 5 minutes)
 */
function canEdit(createdAt: string): boolean {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const messageTime = new Date(createdAt);
  return messageTime > fiveMinutesAgo;
}

export function MessageBubble({
  message,
  sender,
  isOwnMessage,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const isDeleted = !!message.deleted_at;
  const isEdited = !!message.edited_at;
  const showActions = isOwnMessage && !isDeleted && (onEdit || onDelete);
  const canEditMessage = canEdit(message.created_at);

  // Sanitize content for safe display
  const safeContent = isDeleted
    ? '(This message was deleted)'
    : sanitizeMessageContent(message.content);

  // Format timestamp
  const timestamp = formatDistanceToNow(new Date(message.created_at), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        'group flex w-full gap-3 px-4 py-2',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
      data-testid="message-bubble"
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={sender.avatar_url || undefined} alt={sender.name} />
        <AvatarFallback className="text-xs">
          {getInitials(sender.name)}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div
        className={cn(
          'flex max-w-[70%] flex-col gap-1',
          isOwnMessage ? 'items-end' : 'items-start'
        )}
      >
        {/* Sender Name (hidden for own messages on most screens) */}
        {!isOwnMessage && (
          <span className="text-xs font-medium text-muted-foreground">
            {sender.name}
          </span>
        )}

        {/* Message Bubble */}
        <div className="flex items-start gap-2">
          {showActions && isOwnMessage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Message actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
                {onEdit && canEditMessage && (
                  <DropdownMenuItem
                    onClick={() => onEdit(message.id)}
                    className="cursor-pointer"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(message.id)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div
            className={cn(
              'rounded-lg px-4 py-2 text-sm',
              isOwnMessage
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground',
              isDeleted && 'italic opacity-60'
            )}
          >
            {safeContent}
            {isEdited && !isDeleted && (
              <span className="ml-2 text-xs opacity-70">(edited)</span>
            )}
          </div>

          {showActions && !isOwnMessage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Message actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
                {onEdit && canEditMessage && (
                  <DropdownMenuItem
                    onClick={() => onEdit(message.id)}
                    className="cursor-pointer"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(message.id)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Timestamp */}
        <span
          className={cn(
            'text-xs text-muted-foreground',
            isOwnMessage && 'text-right'
          )}
        >
          {timestamp}
        </span>
      </div>
    </div>
  );
}
