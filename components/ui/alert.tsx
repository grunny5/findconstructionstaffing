import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Industrial Design System - Alert Component
 *
 * Uses industrial color palette for error/success states:
 * - destructive/error: industrial-orange (not bright red)
 * - success: industrial-graphite-600 (monochromatic, not green)
 * - info: industrial-navy
 * - warning: industrial-orange-200 background
 */
const alertVariants = cva(
  'relative w-full font-body border-2 rounded-industrial-sharp p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
  {
    variants: {
      variant: {
        default:
          'bg-industrial-bg-card border-industrial-graphite-300 text-industrial-graphite-600 [&>svg]:text-industrial-graphite-400',
        destructive:
          'bg-industrial-orange-100 border-industrial-orange text-industrial-graphite-600 [&>svg]:text-industrial-orange',
        warning:
          'bg-industrial-orange-100 border-industrial-orange-300 text-industrial-graphite-600 [&>svg]:text-industrial-orange-400',
        info: 'bg-industrial-navy-100 border-industrial-navy-300 text-industrial-graphite-600 [&>svg]:text-industrial-navy',
        success:
          'bg-industrial-graphite-100 border-industrial-graphite-400 text-industrial-graphite-600 [&>svg]:text-industrial-graphite-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      'mb-1 font-body font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('font-body text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
