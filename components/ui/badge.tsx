import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  // Industrial Design System: Badge base styles
  'inline-flex items-center font-body text-xs font-semibold uppercase tracking-wide rounded-industrial-sharp px-2 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-industrial-orange focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Industrial Primary: Graphite (default) - monochromatic
        default:
          'bg-industrial-graphite-600 text-white hover:bg-industrial-graphite-500',
        // Industrial Secondary: Light graphite background
        secondary:
          'bg-industrial-graphite-100 text-industrial-graphite-600 hover:bg-industrial-graphite-200',
        // Industrial Orange: Welding/Fabrication category - monochromatic
        orange:
          'bg-industrial-orange text-white hover:bg-industrial-orange-500',
        // Industrial Navy: Electrical category - monochromatic
        navy: 'bg-industrial-navy text-white hover:bg-industrial-navy-500',
        // Industrial Graphite: Mechanical/General category - monochromatic
        graphite:
          'bg-industrial-graphite-600 text-white hover:bg-industrial-graphite-500',
        // Destructive: Maintains warning semantic
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/80',
        // Outline: Industrial border styling
        outline:
          'border-2 border-industrial-graphite-300 bg-transparent text-industrial-graphite-500 hover:border-industrial-graphite-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
