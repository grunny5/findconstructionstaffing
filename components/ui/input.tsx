import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Industrial Design System: Input styles
          'flex h-auto w-full font-body text-base',
          // Border & Shape
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
          // File input styling
          'file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-industrial-graphite-600',
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
Input.displayName = 'Input';

export { Input };
