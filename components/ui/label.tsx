'use client';

/**
 * Label Component - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 5.3 - Update All Shadcn Form Components
 *
 * Styling: Barlow font, 0.75rem (text-xs), uppercase, 600 weight, graphite-400
 */

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const labelVariants = cva(
  // Industrial Design System: Label styles
  // Barlow font, uppercase, semibold, graphite-400
  'font-body text-sm font-medium leading-none text-industrial-graphite-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: '',
        // Industrial form label style - uppercase, smaller, tracking
        industrial:
          'text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, variant, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant }), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
