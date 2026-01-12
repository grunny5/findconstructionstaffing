import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import Header from '@/components/Header';

/**
 * Messages Loading State
 * Feature: Phase 1 - UI/UX Production Readiness
 * Task: 1.2 - Loading State Rollout
 *
 * Skeleton UI for messages inbox during data fetch.
 * Matches the layout of conversation list with sidebar structure.
 */
export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <Skeleton className="h-10 w-48 mb-4" />
            <div className="flex gap-4 mb-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>

          {/* Conversations List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Sidebar - Conversation List */}
            <div className="lg:col-span-1 space-y-2">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Right Panel - Empty State for Desktop */}
            <div className="hidden lg:block lg:col-span-2">
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <Skeleton className="h-8 w-64 mx-auto mb-4" />
                  <Skeleton className="h-4 w-96 mx-auto" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
