'use client';

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

export default function VerifyEmailErrorPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Verification failed';

  const isExpiredLink = message.toLowerCase().includes('expired');
  const isAlreadyVerified = message.toLowerCase().includes('already');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            {isAlreadyVerified ? (
              <AlertTriangle
                className="h-10 w-10 text-orange-600"
                data-testid="alert-triangle-icon"
              />
            ) : (
              <XCircle
                className="h-10 w-10 text-red-600"
                data-testid="x-circle-icon"
              />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isAlreadyVerified ? 'Already Verified' : 'Verification Failed'}
          </CardTitle>
          <CardDescription className="text-base">{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isExpiredLink && (
            <Alert>
              <AlertDescription>
                Verification links expire after 24 hours for security reasons.
                Please request a new verification email below.
              </AlertDescription>
            </Alert>
          )}

          {isAlreadyVerified && (
            <Alert>
              <AlertDescription>
                Your email has already been verified. You can proceed to sign
                in.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {isAlreadyVerified ? (
              <Button asChild className="w-full" size="lg">
                <Link href="/login">Sign In</Link>
              </Button>
            ) : (
              <>
                <Button asChild className="w-full" size="lg" variant="outline">
                  <Link href="/signup">Resend Verification Email</Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Note: If you haven&apos;t signed up yet, you&apos;ll need to
                  create an account first.
                </p>
              </>
            )}
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Return to Home
            </Link>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              Need help?{' '}
              <Link
                href="mailto:support@findconstructionstaffing.com"
                className="text-primary underline"
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
