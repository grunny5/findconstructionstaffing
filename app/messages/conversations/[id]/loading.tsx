import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import Header from '@/components/Header';

/**
 * Conversation Thread Loading State
 * Feature: Phase 1 - UI/UX Production Readiness
 * Task: 1.2 - Loading State Rollout
 *
 * Skeleton UI for conversation thread during data fetch.
 * Matches the layout of message thread with chat bubbles.
 */
export default function ConversationLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Conversation Header */}
          <Card className="mb-4 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </Card>

          {/* Messages Area */}
          <Card className="p-6 mb-4" style={{ minHeight: '500px' }}>
            <div className="space-y-4">
              {/* Message Bubbles */}
              {[...Array(5)].map((_, i) => {
                const isOwnMessage = i % 2 === 0;
                return (
                  <div
                    key={i}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}
                    >
                      {!isOwnMessage && (
                        <Skeleton className="h-4 w-24 mb-1" />
                      )}
                      <Skeleton
                        className={`h-20 ${isOwnMessage ? 'w-64' : 'w-72'} rounded-lg`}
                      />
                      <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Message Input Area */}
          <Card className="p-4">
            <div className="flex items-end gap-3">
              <Skeleton className="flex-1 h-24 rounded-lg" />
              <Skeleton className="h-12 w-24" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
