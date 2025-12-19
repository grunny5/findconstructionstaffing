import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClaimLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-80 mb-2" data-testid="title-skeleton" />
          <Skeleton
            className="h-5 w-96 max-w-full"
            data-testid="subtitle-skeleton"
          />
        </div>

        {/* Agency Reference Card Skeleton */}
        <Card className="mb-8" data-testid="agency-card-skeleton">
          <CardHeader>
            <Skeleton
              className="h-6 w-48"
              data-testid="card-title-skeleton"
            />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {/* Logo Skeleton */}
              <Skeleton
                className="w-16 h-16 rounded-lg flex-shrink-0"
                data-testid="logo-skeleton"
              />
              {/* Agency Info Skeleton */}
              <div className="flex-1">
                <Skeleton
                  className="h-6 w-64 mb-2"
                  data-testid="agency-name-skeleton"
                />
                <Skeleton
                  className="h-4 w-48"
                  data-testid="agency-location-skeleton"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Card Skeleton */}
        <Card data-testid="form-card-skeleton">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Form fields skeleton */}
              {[...Array(4)].map((_, i) => (
                <div key={i} data-testid="form-field-skeleton">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}

              {/* Submit button skeleton */}
              <Skeleton className="h-12 w-full mt-6" />
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
