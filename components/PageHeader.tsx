'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * PageHeader Component - Accessibility Excellence
 *
 * Accessible page header that receives focus after client-side navigation.
 * Follows WCAG 2.1 guidelines for focus management.
 *
 * Features:
 * - Automatic focus on route change for screen reader announcement
 * - tabIndex={-1} to allow programmatic focus without tab order
 * - Industrial design system styling
 * - Keyboard navigation support
 *
 * Usage: <PageHeader title="Resources" subtitle="Optional subtitle" />
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const pathname = usePathname();

  // Focus h1 after client-side navigation for screen reader announcement
  useEffect(() => {
    h1Ref.current?.focus();
  }, [pathname]);

  return (
    <div className={cn('space-y-2', className)}>
      <h1
        ref={h1Ref}
        tabIndex={-1}
        className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-industrial-graphite-600 outline-none focus:outline-none"
      >
        {title}
      </h1>
      {subtitle && (
        <p className="font-body text-lg text-industrial-graphite-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
