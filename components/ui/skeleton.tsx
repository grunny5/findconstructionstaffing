import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-industrial-sharp bg-industrial-graphite-100',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
