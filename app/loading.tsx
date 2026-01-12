import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Root Loading State
 * Feature: Phase 1 - UI/UX Production Readiness
 * Task: 1.2 - Loading State Rollout
 *
 * Provides a generic loading skeleton that appears during page transitions
 * when no route-specific loading.tsx exists. Includes header and footer for
 * consistent layout structure and prevents cumulative layout shift (CLS).
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-industrial-bg-primary">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-12 w-3/4 max-w-2xl mb-4" />
          <Skeleton className="h-5 w-1/2 max-w-xl" />
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-6 border-2 border-industrial-graphite-200 rounded-industrial-sharp bg-industrial-bg-card"
            >
              <Skeleton className="h-48 mb-4 rounded-industrial-sharp" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>

        {/* Additional Content Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-4 w-full max-w-4xl" />
          <Skeleton className="h-4 w-5/6 max-w-4xl" />
          <Skeleton className="h-4 w-4/6 max-w-4xl" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
