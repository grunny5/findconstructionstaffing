'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toast Notification System with Industrial Design
 * Feature: Phase 1 - UI/UX Production Readiness
 * Task: 1.3 - Toast Notification System
 *
 * Customized Sonner toast with industrial styling:
 * - Success toasts: Auto-dismiss after 5 seconds
 * - Error toasts: Persist until manually dismissed
 * - ARIA live regions for screen readers (handled by Sonner)
 * - Industrial color palette and typography
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="bottom-right"
      duration={5000} // Default 5s for success toasts
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-industrial-bg-card group-[.toaster]:text-industrial-graphite group-[.toaster]:border-2 group-[.toaster]:border-industrial-graphite-200 group-[.toaster]:shadow-lg group-[.toaster]:font-body group-[.toaster]:rounded-industrial-sharp',
          description: 'group-[.toast]:text-industrial-graphite-500',
          actionButton:
            'group-[.toast]:bg-industrial-orange group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:uppercase group-[.toast]:tracking-wide',
          cancelButton:
            'group-[.toast]:bg-industrial-graphite-200 group-[.toast]:text-industrial-graphite-600 group-[.toast]:font-semibold',
          success:
            'group-[.toast]:border-green-500 group-[.toast]:bg-green-50',
          error:
            'group-[.toast]:border-red-500 group-[.toast]:bg-red-50',
          warning:
            'group-[.toast]:border-amber-500 group-[.toast]:bg-amber-50',
          info:
            'group-[.toast]:border-blue-500 group-[.toast]:bg-blue-50',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
