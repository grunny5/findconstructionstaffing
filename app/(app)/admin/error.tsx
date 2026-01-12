'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCw, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { TimeoutError } from '@/lib/fetch/timeout';

/**
 * Admin Error Boundary
 * Feature: Phase 1 - UI/UX Production Readiness
 * Task: 1.1 - Error Boundary Implementation
 *
 * Catches errors in admin routes and provides contextual recovery options.
 * Maintains admin layout structure for consistent UX.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin panel error:', error);

    // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     tags: { boundary: 'admin', section: 'admin-panel' },
    //     extra: { digest: error.digest },
    //   });
    // }
  }, [error]);

  // Detect if this is a timeout error
  const isTimeout =
    error instanceof TimeoutError ||
    error.message?.includes('timeout') ||
    error.message?.includes('Request timeout');

  return (
    <div className="min-h-screen bg-industrial-bg-primary flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isTimeout ? 'bg-amber-100' : 'bg-red-100'
            }`}
          >
            {isTimeout ? (
              <Clock className="h-10 w-10 text-amber-600" />
            ) : (
              <AlertCircle className="h-10 w-10 text-red-600" />
            )}
          </div>

          <h1 className="font-display text-3xl uppercase text-industrial-graphite mb-4">
            {isTimeout
              ? 'Admin operation timed out'
              : 'Admin error occurred'}
          </h1>

          <p className="font-body text-industrial-graphite-500 mb-8">
            {isTimeout ? (
              <>
                This admin operation is taking longer than expected. This could
                be due to a large dataset or high server load. Please try again.
              </>
            ) : (
              <>
                An error occurred while processing your admin request. Please
                try again or return to the admin dashboard.
              </>
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => reset()}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>

            <Button variant="outline" asChild>
              <Link href="/admin" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin Dashboard
              </Link>
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-sm font-mono text-gray-700">
                Error: {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
