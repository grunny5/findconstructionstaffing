/**
 * Textarea Component - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 5.3 - Update All Shadcn Form Components
 *
 * Styling: Matches Input component - 2px border, sharp corners, orange focus
 */

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Industrial Design System: Textarea styles (matches Input)
          'flex min-h-[120px] w-full font-body text-base',
          // Border & Shape - 2px border, sharp corners
          'border-2 border-industrial-graphite-300 rounded-industrial-sharp',
          // Spacing
          'px-4 py-3',
          // Background
          'bg-industrial-bg-card',
          // Placeholder
          'placeholder:text-industrial-graphite-400',
          // Focus state - orange border, no ring
          'focus:outline-none focus:border-industrial-orange focus:ring-0',
          // Transition
          'transition-colors duration-200',
          // Resize
          'resize-y',
          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-industrial-graphite-100',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
