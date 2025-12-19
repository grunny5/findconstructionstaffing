import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { ClaimRequestForm } from '@/components/ClaimRequestForm';
import type { Agency, AgencyResponse } from '@/types/api';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function ClaimAgencyPage({ params }: PageProps) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect(`/login?redirectTo=/claim/${params.slug}`);
    return null;
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/agencies/${params.slug}`,
    {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      notFound();
      return null;
    }
    throw new Error('Failed to fetch agency data');
  }

  const data: AgencyResponse = await response.json();
  const agency: Agency = data.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Claim Agency Profile
          </h1>
          <p className="text-gray-600">
            Submit a request to claim and manage this agency profile
          </p>
        </div>

        {/* Agency Reference Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">
              Agency You&apos;re Claiming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {/* Agency Logo */}
              {agency.logo_url ? (
                <Image
                  src={agency.logo_url}
                  alt={`${agency.name} logo`}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
              )}

              {/* Agency Info */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {agency.name}
                </h2>
                {agency.headquarters && (
                  <p className="text-gray-600 text-sm">{agency.headquarters}</p>
                )}
              </div>

              {/* Claimed Badge */}
              {agency.is_claimed && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Claimed</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Already Claimed Alert */}
        {agency.is_claimed ? (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Agency Already Claimed</AlertTitle>
            <AlertDescription>
              This agency profile has already been claimed by another user. If
              you believe this is your agency, please contact support for
              assistance.
            </AlertDescription>
            <div className="mt-4 flex gap-3">
              <Button variant="outline" asChild>
                <Link href={`/recruiters/${params.slug}`}>
                  View Agency Profile
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Back to Directory</Link>
              </Button>
            </div>
          </Alert>
        ) : (
          /* Claim Request Form */
          <ClaimRequestForm
            agencyId={agency.id}
            agencyName={agency.name}
            agencyWebsite={agency.website}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
