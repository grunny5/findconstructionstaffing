"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AgencyCardSkeleton() {
  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Logo Skeleton */}
          <div className="flex-shrink-0">
            <Skeleton className="w-20 h-20 rounded-3xl" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1">
                {/* Header with name and badges */}
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>

                {/* Description */}
                <div className="space-y-2 mb-6">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                </div>

                {/* Company Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-7 w-24 rounded-lg" />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 lg:flex-shrink-0">
                <Skeleton className="h-10 w-full lg:w-40 rounded-xl" />
                <Skeleton className="h-10 w-full lg:w-40 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}