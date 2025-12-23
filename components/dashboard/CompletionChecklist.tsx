import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  link: string;
}

interface CompletionChecklistProps {
  items: ChecklistItem[];
  className?: string;
}

export function CompletionChecklist({
  items,
  className,
}: CompletionChecklistProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium">Complete your profile:</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.link}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors hover:text-primary',
                item.completed
                  ? 'text-muted-foreground opacity-50'
                  : 'text-foreground'
              )}
            >
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 flex-shrink-0" />
              )}
              <span className={item.completed ? 'line-through' : ''}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Helper function to generate checklist items based on agency profile
 */
export function generateChecklistItems(profile: {
  logo_url?: string | null;
  description?: string | null;
  trades?: unknown[];
  regions?: unknown[];
  phone?: string | null;
  email?: string | null;
}): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Check logo
  items.push({
    id: 'logo',
    label: 'Add Logo',
    completed: Boolean(profile.logo_url?.trim()),
    link: '/dashboard/profile#logo',
  });

  // Check description (must be at least 100 chars)
  const hasValidDescription =
    profile.description && profile.description.trim().length >= 100;
  items.push({
    id: 'description',
    label: 'Complete Description (at least 100 characters)',
    completed: Boolean(hasValidDescription),
    link: '/dashboard/profile#description',
  });

  // Check trades
  items.push({
    id: 'trades',
    label: 'Select Trades',
    completed: Boolean(profile.trades && profile.trades.length > 0),
    link: '/dashboard/profile#trades',
  });

  // Check regions
  items.push({
    id: 'regions',
    label: 'Select Regions',
    completed: Boolean(profile.regions && profile.regions.length > 0),
    link: '/dashboard/profile#regions',
  });

  // Check contact info (phone OR email)
  const hasContactInfo =
    (profile.phone && profile.phone.trim()) ||
    (profile.email && profile.email.trim());
  items.push({
    id: 'contact',
    label: 'Add Contact Info (phone or email)',
    completed: Boolean(hasContactInfo),
    link: '/dashboard/profile#contact',
  });

  return items;
}
