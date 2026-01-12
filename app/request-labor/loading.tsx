import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Request Labor Loading State
 * Feature: Phase 1 - UI/UX Production Readiness
 * Task: 1.2 - Loading State Rollout
 *
 * Skeleton UI for the request labor page during data fetch.
 * Matches the layout of the labor request form.
 */
export default function RequestLaborLoading() {
  return (
    <div className="min-h-screen bg-industrial-bg-primary">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-12 w-2/3 mb-4" />
            <Skeleton className="h-5 w-full max-w-2xl mb-2" />
            <Skeleton className="h-5 w-3/4 max-w-xl" />
          </div>

          {/* Form Section Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>

              {/* Location Section */}
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>

              {/* Contact Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-32 w-full" />
              </div>

              {/* Submit Button */}
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
