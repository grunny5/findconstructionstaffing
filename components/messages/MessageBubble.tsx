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

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil, Trash2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeMessageContent } from '@/lib/utils/sanitize';
import { toast } from 'sonner';

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
  isAdmin?: boolean; // New prop for admin users
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
  isAdmin = false,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isDeleted = !!message.deleted_at;
  const isEdited = !!message.edited_at;

  // Show actions if:
  // 1. It's the user's own message and not deleted, OR
  // 2. User is an admin and message is not deleted
  const showActions = !isDeleted && ((isOwnMessage && (onEdit || onDelete)) || (isAdmin && onDelete));
  const canEditMessage = canEdit(message.created_at);

  // Sanitize content for safe display
  const safeContent = isDeleted
    ? '(This message was deleted)'
    : sanitizeMessageContent(message.content);

  // Format timestamp
  const timestamp = formatDistanceToNow(new Date(message.created_at), {
    addSuffix: true,
  });

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      try {
        await onDelete(message.id);
        toast.success('Message deleted');
        setShowDeleteConfirm(false);
      } catch (error) {
        toast.error('Failed to delete message');
        console.error('Delete error:', error);
      }
    }
  };

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
                {onEdit && canEditMessage && isOwnMessage && !isAdmin && (
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
                    onClick={handleDeleteClick}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isAdmin && !isOwnMessage ? 'Delete (Admin)' : 'Delete'}
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
                {onEdit && canEditMessage && isOwnMessage && !isAdmin && (
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
                    onClick={handleDeleteClick}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isAdmin && !isOwnMessage ? 'Delete (Admin)' : 'Delete'}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAdmin && !isOwnMessage
                ? 'Delete this message? (Admin Action)'
                : 'Delete this message?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin && !isOwnMessage
                ? 'This message will be removed by a moderator. This action cannot be undone and will be logged for audit purposes.'
                : 'This action cannot be undone. The message will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
