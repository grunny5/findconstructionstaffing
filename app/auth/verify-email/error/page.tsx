'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, AlertTriangle } from 'lucide-react';

function VerifyEmailErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Verification failed';

  const isExpiredLink = message.toLowerCase().includes('expired');
  const isAlreadyVerified = message.toLowerCase().includes('already');

  return (
    <div className="flex min-h-screen items-center justify-center bg-industrial-bg-primary p-4">
      <Card className="w-full max-w-md bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200">
        <CardHeader className="text-center">
          {/* Orange circle with appropriate icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-industrial-sharp bg-industrial-orange-100">
            {isAlreadyVerified ? (
              <AlertTriangle
                className="h-10 w-10 text-industrial-orange"
                data-testid="alert-triangle-icon"
              />
            ) : (
              <XCircle
                className="h-10 w-10 text-industrial-orange"
                data-testid="x-circle-icon"
              />
            )}
          </div>
          <CardTitle className="font-display text-3xl uppercase tracking-wide text-industrial-graphite-600">
            {isAlreadyVerified ? 'Already Verified' : 'Verification Failed'}
          </CardTitle>
          <CardDescription className="font-body text-base text-industrial-graphite-500">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isExpiredLink && (
            <Alert className="bg-industrial-orange-100 border-l-4 border-industrial-orange rounded-industrial-sharp">
              <AlertDescription className="font-body text-sm text-industrial-graphite-600">
                Verification links expire after 24 hours for security reasons.
                Please request a new verification email below.
              </AlertDescription>
            </Alert>
          )}

          {isAlreadyVerified && (
            <Alert className="bg-industrial-orange-100 border-l-4 border-industrial-orange rounded-industrial-sharp">
              <AlertDescription className="font-body text-sm text-industrial-graphite-600">
                Your email has already been verified. You can proceed to sign
                in.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {isAlreadyVerified ? (
              <Button
                asChild
                className="w-full font-body text-sm uppercase font-semibold"
                size="lg"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  className="w-full font-body text-sm uppercase font-semibold"
                  size="lg"
                  variant="outline"
                >
                  <Link href="/signup">Resend Verification Email</Link>
                </Button>
                <p className="text-center font-body text-xs text-industrial-graphite-500">
                  Note: If you haven&apos;t signed up yet, you&apos;ll need to
                  create an account first.
                </p>
              </>
            )}
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="font-body text-sm font-semibold text-industrial-orange hover:text-industrial-orange-dark transition-colors"
            >
              Return to Home
            </Link>
          </div>

          <Alert className="bg-industrial-bg-card border border-industrial-graphite-200 rounded-industrial-sharp">
            <AlertDescription className="font-body text-xs text-industrial-graphite-500">
              Need help?{' '}
              <Link
                href="mailto:support@findconstructionstaffing.com"
                className="text-industrial-orange hover:text-industrial-orange-dark underline transition-colors"
              >
                Contact support
              </Link>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-industrial-bg-primary p-4">
          <Card className="w-full max-w-md bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200">
            <CardHeader>
              <CardTitle className="font-display text-xl uppercase tracking-wide text-industrial-graphite-600">
                Email Verification
              </CardTitle>
              <CardDescription className="font-body text-sm text-industrial-graphite-500">
                Loading...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <VerifyEmailErrorContent />
    </Suspense>
  );
}
