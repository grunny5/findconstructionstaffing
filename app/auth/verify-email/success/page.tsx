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
import { CheckCircle2 } from 'lucide-react';

const CARD_CLASS =
  'w-full max-w-md bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200';

function VerifyEmailSuccessContent() {
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified');

  if (!verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-industrial-bg-primary p-4">
        <Card className={CARD_CLASS}>
          <CardHeader>
            <CardTitle className="font-display text-xl uppercase tracking-wide text-industrial-graphite-600">
              Email Verification
            </CardTitle>
            <CardDescription className="font-body text-sm text-industrial-graphite-500">
              Invalid verification link. Please check your email for the correct
              link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full font-body text-sm uppercase font-semibold"
            >
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-industrial-bg-primary p-4">
      <Card className={CARD_CLASS}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-industrial-sharp bg-industrial-orange-100">
            <CheckCircle2 className="h-10 w-10 text-industrial-orange" />
          </div>
          <CardTitle className="font-display text-3xl uppercase tracking-wide text-industrial-graphite-600">
            Email Verified!
          </CardTitle>
          <CardDescription className="font-body text-base text-industrial-graphite-500">
            Your email address has been successfully verified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center font-body text-sm text-industrial-graphite-500">
            You can now sign in to your FindConstructionStaffing account and
            start exploring staffing opportunities.
          </p>
          <Button
            asChild
            className="w-full font-body text-sm uppercase font-semibold"
            size="lg"
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <div className="text-center">
            <Link
              href="/"
              className="font-body text-sm font-semibold text-industrial-orange hover:text-industrial-orange-dark transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-industrial-bg-primary p-4">
          <Card className={CARD_CLASS}>
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
      <VerifyEmailSuccessContent />
    </Suspense>
  );
}
