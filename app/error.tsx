'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Home, RefreshCw, Clock } from 'lucide-react';
import Link from 'next/link';
import { TimeoutError } from '@/lib/fetch/timeout';

/**
 * Root Error Boundary
 * Feature: Phase 1 - UI/UX Production Readiness
 * Task: 1.1 - Error Boundary Implementation
 *
 * Catches all unhandled errors at the root level and provides user-friendly
 * error recovery options. Distinguishes between timeout errors and other failures.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);

    // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     tags: { boundary: 'root' },
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
    <html lang="en">
      <body>
        <div className="min-h-screen bg-industrial-cream flex items-center justify-center p-4">
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
                  ? 'Taking longer than expected'
                  : 'Something went wrong'}
              </h1>

              <p className="font-body text-industrial-graphite-500 mb-8">
                {isTimeout ? (
                  <>
                    The page is taking longer than usual to load. This could be
                    due to a slow connection or high server load. Please try
                    again in a moment.
                  </>
                ) : (
                  <>
                    We've encountered an unexpected error. Please try
                    refreshing the page or return to the directory.
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
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Back to Directory
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
      </body>
    </html>
  );
}
