'use client';

/**
 * RadioGroup Component - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 5.3 - Update All Shadcn Form Components
 *
 * Styling: 2px border, rounded (for radio), orange-400 when selected
 * Touch target: 44px minimum for mobile accessibility
 */

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';

import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn('grid gap-3', className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        // Industrial Design System: Radio styles
        'aspect-square shrink-0',
        // Size - adequate touch target
        'h-5 w-5',
        // Border & Shape - 2px border, rounded for radio
        'border-2 border-industrial-graphite-300 rounded-full',
        // Background
        'bg-industrial-bg-card',
        // Focus state - orange border
        'focus:outline-none focus-visible:border-industrial-orange',
        // Transition
        'transition-colors duration-200',
        // Selected state - orange border
        'data-[state=checked]:border-industrial-orange',
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-industrial-graphite-100',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-industrial-orange text-industrial-orange" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
