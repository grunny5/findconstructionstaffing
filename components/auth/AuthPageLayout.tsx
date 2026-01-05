import React from 'react';
import { cn } from '@/lib/utils';

export interface AuthPageLayoutProps {
  children: React.ReactNode;
  showHero?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg';
}

/**
 * Shared layout component for authentication pages.
 * Provides consistent industrial design system styling across all auth flows.
 *
 * Features:
 * - Cream background matching industrial design system
 * - Optional hero section with dark graphite background and orange border
 * - Centered card container with configurable max-width
 * - Mobile responsive layout
 *
 * @example
 * ```tsx
 * <AuthPageLayout
 *   showHero
 *   heroTitle="CREATE YOUR ACCOUNT"
 *   heroSubtitle="Join the FindConstructionStaffing network"
 *   maxWidth="md"
 * >
 *   <Card>...</Card>
 * </AuthPageLayout>
 * ```
 */
export function AuthPageLayout({
  children,
  showHero = false,
  heroTitle,
  heroSubtitle,
  maxWidth = 'md',
}: AuthPageLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm', // 384px
    md: 'max-w-md', // 448px
    lg: 'max-w-2xl', // 672px
  };

  return (
    <div className="min-h-screen bg-industrial-bg-primary">
      {/* Optional Hero Section */}
      {showHero && (heroTitle || heroSubtitle) && (
        <section className="bg-industrial-graphite-600 py-12 md:py-16 border-b-4 border-industrial-orange">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {heroTitle && (
              <h1 className="font-display text-white uppercase text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4">
                {heroTitle}
              </h1>
            )}
            {heroSubtitle && (
              <p className="font-body text-xl md:text-2xl text-industrial-graphite-200 max-w-3xl">
                {heroSubtitle}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className={cn('mx-auto w-full', maxWidthClasses[maxWidth])}>
          {children}
        </div>
      </div>
    </div>
  );
}
