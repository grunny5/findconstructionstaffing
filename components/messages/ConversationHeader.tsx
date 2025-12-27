/**
 * ConversationHeader Component
 *
 * Header for conversation thread showing participant info and context
 *
 * Features:
 * - Other participant's avatar and name
 * - Context banner for agency inquiries
 * - Link to agency profile
 * - Conversation start date
 * - Back button on mobile
 * - Responsive design
 * - Accessibility features
 */

'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConversationHeaderProps {
  conversation: {
    id: string;
    context_type: 'agency_inquiry' | 'general';
    context_agency?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    participants: Array<{
      user_id: string;
      user: {
        id: string;
        name: string;
        avatar_url?: string | null;
        role?: string | null;
      };
    }>;
    created_at: string;
  };
  currentUserId: string;
  onBack?: () => void;
}

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ConversationHeader({
  conversation,
  currentUserId,
  onBack,
}: ConversationHeaderProps) {
  // Find the other participant
  const otherParticipant = conversation.participants.find(
    (p) => p.user_id !== currentUserId
  );

  if (!otherParticipant) {
    return null;
  }

  const { user } = otherParticipant;
  const isAgencyInquiry = conversation.context_type === 'agency_inquiry';
  const hasAgencyContext = isAgencyInquiry && conversation.context_agency;

  // Format start date
  const startDate = format(new Date(conversation.created_at), 'MMM d, yyyy');

  return (
    <div className="flex flex-col gap-3 border-b bg-background p-4">
      {/* Top Row: Back Button + Avatar + Name */}
      <div className="flex items-center gap-3">
        {/* Back Button (mobile only) */}
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0 md:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>

        {/* Name + Role */}
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-lg font-semibold">{user.name}</h2>
          {user.role && (
            <p className="text-sm text-muted-foreground">{user.role}</p>
          )}
        </div>
      </div>

      {/* Context Banner (if agency inquiry) */}
      {hasAgencyContext && (
        <div className="flex flex-col gap-2 rounded-md bg-muted p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">
              Inquiry about{' '}
              <span className="font-medium text-foreground">
                {conversation.context_agency!.name}
              </span>
            </span>
          </div>
          <Link
            href={`/recruiters/${conversation.context_agency!.slug}`}
            className="text-primary hover:underline"
          >
            View Profile
          </Link>
        </div>
      )}

      {/* Start Date */}
      <p className="text-xs text-muted-foreground">Started {startDate}</p>
    </div>
  );
}
