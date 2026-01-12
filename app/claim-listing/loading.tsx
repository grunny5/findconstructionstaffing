import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Claim Listing Loading State
 * Feature: Phase 1 - UI/UX Production Readiness
 * Task: 1.2 - Loading State Rollout
 *
 * Skeleton UI for the claim listing page during data fetch.
 * Matches the layout of search + form structure.
 */
export default function ClaimListingLoading() {
  return (
    <div className="min-h-screen bg-industrial-bg-primary">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-12 w-2/3 mb-4" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </div>

          {/* Search Section Skeleton */}
          <Card className="mb-8">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>

          {/* Form Section Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Form Fields */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className={`h-${i === 4 ? '32' : '12'} w-full`} />
                </div>
              ))}

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
