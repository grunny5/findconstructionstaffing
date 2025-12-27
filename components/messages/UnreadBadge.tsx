/**
 * UnreadBadge Component
 *
 * Red circular badge showing unread message counts
 *
 * Features:
 * - Shows count number (1-9, or custom max)
 * - Shows "9+" (or "max+") when count exceeds max
 * - Hidden when count is 0
 * - Red background with white text
 * - Small, circular design for navigation
 * - Accessible with ARIA attributes
 */

'use client';

import { Badge } from '@/components/ui/badge';

export interface UnreadBadgeProps {
  count: number;
  max?: number;
}

export function UnreadBadge({ count, max = 9 }: UnreadBadgeProps) {
  // Don't render anything if count is 0 or negative
  if (count <= 0) {
    return null;
  }

  // Determine display text
  const displayText = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      variant="destructive"
      className="h-5 min-w-[20px] rounded-full px-1.5 text-xs font-medium"
      aria-label={`${count} unread message${count === 1 ? '' : 's'}`}
    >
      {displayText}
    </Badge>
  );
}
