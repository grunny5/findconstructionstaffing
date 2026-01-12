import { cn } from '@/lib/utils';

/**
 * Skeleton Component - Industrial Design System
 * Loading placeholder with industrial styling
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Industrial Design System: Skeleton loading state
        'animate-pulse rounded-industrial-sharp bg-industrial-graphite-100',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
