import { Construction, Search, Filter, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * EmptyState Component - Industrial Design System
 *
 * Construction-themed empty state component with industrial styling.
 * Uses industrial color palette, Bebas Neue display font, and sharp corners.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   variant="no-results"
 *   title="No Agencies Found"
 *   description="Try adjusting your filters or clearing them to see more results."
 *   illustration="filter"
 *   action={{ label: "Clear Filters", onClick: handleClearFilters }}
 * />
 * ```
 */

interface EmptyStateProps {
  /** Visual style variant */
  variant: 'no-results' | 'no-data' | 'error';
  /** Main heading text (will be uppercase per industrial design) */
  title: string;
  /** Descriptive text explaining the empty state */
  description: string;
  /** Optional action button */
  action?: { label: string; onClick: () => void };
  /** Icon to display */
  illustration?: 'search' | 'filter' | 'construction' | 'error';
}

export function EmptyState({
  variant,
  title,
  description,
  action,
  illustration = 'search',
}: EmptyStateProps) {
  // Select icon based on illustration prop
  const iconMap = {
    construction: Construction,
    filter: Filter,
    error: AlertCircle,
    search: Search,
  } as const;

  const Icon = iconMap[illustration];

  // Select background color based on variant
  const iconBgColor =
    variant === 'error'
      ? 'bg-destructive/10'
      : 'bg-industrial-graphite-100';

  const iconColor =
    variant === 'error'
      ? 'text-destructive'
      : 'text-industrial-graphite-500';

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon Container - Industrial styling with sharp corners */}
      <div
        className={`mb-6 rounded-industrial-sharp p-6 ${iconBgColor}`}
        aria-hidden="true"
      >
        <Icon className={`h-12 w-12 ${iconColor}`} />
      </div>

      {/* Title - Bebas Neue display font, uppercase, graphite color */}
      <h3 className="font-display text-2xl uppercase tracking-wide text-industrial-graphite-600 mb-2">
        {title}
      </h3>

      {/* Description - Barlow body font */}
      <p className="font-body text-industrial-graphite-500 max-w-md mb-6">
        {description}
      </p>

      {/* Action Button - Uses industrial button styling */}
      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          size="lg"
          className="px-8"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
