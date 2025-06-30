import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileSkeleton() {
  return (
    <>
      {/* Hero Section Skeleton */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Logo Skeleton */}
            <div className="flex-shrink-0">
              <Skeleton className="w-32 h-32 rounded-lg" />
            </div>

            {/* Agency Details Skeleton */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Name */}
                  <Skeleton className="h-9 w-80 mb-4" />
                  
                  {/* Badges */}
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full max-w-3xl" />
                    <Skeleton className="h-5 w-5/6 max-w-3xl" />
                    <Skeleton className="h-5 w-4/6 max-w-3xl" />
                  </div>
                </div>
                
                {/* CTA Buttons Skeleton */}
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-12 w-[200px]" />
                  <Skeleton className="h-12 w-[200px]" />
                </div>
              </div>

              {/* Quick Stats Skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content Skeleton */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Tab-like header */}
                <div className="flex gap-4 mb-6 border-b pb-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-28" />
                </div>
                
                {/* Content */}
                <div>
                  {/* Title */}
                  <Skeleton className="h-6 w-48 mb-4" />
                  
                  {/* Text content */}
                  <div className="space-y-2 mb-6">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                  
                  {/* Info items */}
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact Info Skeleton */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardContent className="p-6">
                {/* Title */}
                <Skeleton className="h-6 w-40 mb-4" />
                
                {/* Contact items */}
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-5 w-36" />
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Back Link Card */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-32" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}