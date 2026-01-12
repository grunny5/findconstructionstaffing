'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Industrial Design System: Base button styles
  'inline-flex items-center justify-center whitespace-nowrap font-body text-sm font-semibold uppercase tracking-wide rounded-industrial-sharp ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-orange focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Industrial Primary: Orange background, white text
        default:
          'bg-industrial-orange text-white hover:bg-industrial-orange-500',
        // Industrial Destructive: Maintains warning/error semantic
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        // Industrial Outline/Secondary: Transparent with graphite border
        outline:
          'border-2 border-industrial-graphite-400 bg-transparent text-industrial-graphite-500 hover:border-industrial-graphite-600 hover:text-industrial-graphite-600',
        // Industrial Secondary: Graphite background
        secondary:
          'bg-industrial-graphite-100 text-industrial-graphite-600 hover:bg-industrial-graphite-200',
        // Industrial Ghost: Minimal styling
        ghost:
          'hover:bg-industrial-graphite-100 hover:text-industrial-graphite-600',
        // Link variant: Uses orange accent
        link: 'text-industrial-orange underline-offset-4 hover:underline hover:text-industrial-orange-500',
      },
      size: {
        // Mobile-first: 44px minimum touch target, can be smaller on desktop
        default: 'min-h-[44px] md:h-10 px-8 py-4',
        sm: 'min-h-[44px] md:h-9 px-3 py-2 text-xs',
        lg: 'min-h-[44px] md:h-11 px-8 py-4',
        icon: 'min-h-[44px] min-w-[44px] md:h-10 md:w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
