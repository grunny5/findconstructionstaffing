'use client';

/**
 * Tabs Component - Industrial Design System
 * Tab navigation with industrial styling
 */

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Industrial Design System: Tab list container
      'inline-flex h-10 items-center justify-center rounded-industrial-sharp bg-industrial-graphite-100 p-1 font-body text-industrial-graphite-500',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Industrial Design System: Tab trigger button
      'inline-flex items-center justify-center whitespace-nowrap rounded-industrial-sharp px-3 py-1.5 text-sm font-body font-semibold uppercase tracking-wide ring-offset-background transition-all',
      // Focus state
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-orange focus-visible:ring-offset-2',
      // Disabled state
      'disabled:pointer-events-none disabled:opacity-50',
      // Active state
      'data-[state=active]:bg-industrial-bg-card data-[state=active]:text-industrial-graphite-600 data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      // Industrial Design System: Tab content panel
      'mt-2 font-body ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-orange focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
