'use client';

/**
 * Checkbox Component - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 5.3 - Update All Shadcn Form Components
 *
 * Styling: 2px border, sharp corners, orange-400 when checked
 * Touch target: 44px minimum for mobile accessibility
 */

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Industrial Design System: Checkbox styles
      'peer shrink-0',
      // Size - adequate touch target
      'h-5 w-5',
      // Border & Shape - 2px border, sharp corners
      'border-2 border-industrial-graphite-300 rounded-industrial-sharp',
      // Background
      'bg-industrial-bg-card',
      // Focus state - orange border, no ring
      'focus-visible:outline-none focus-visible:border-industrial-orange',
      // Transition
      'transition-colors duration-200',
      // Checked state - orange background
      'data-[state=checked]:bg-industrial-orange data-[state=checked]:border-industrial-orange data-[state=checked]:text-white',
      // Disabled state
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-industrial-graphite-100',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-current')}
    >
      <Check className="h-3.5 w-3.5 stroke-[3]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
