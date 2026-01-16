'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Clock, Users, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LaborRequestSuccess {
  success: boolean;
  request: {
    id: string;
    projectName: string;
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    submittedAt: string;
    craftCount: number;
  };
  matches: {
    total: number;
    byCraft: Array<{
      craftName: string;
      matches: number;
    }>;
  };
  expiresAt: string;
}

export default function LaborRequestSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LaborRequestSuccess | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No confirmation token provided');
      setLoading(false);
      return;
    }

    fetchRequestDetails();
  }, [token]);

  const fetchRequestDetails = async () => {
    try {
      const response = await fetch(
        `/api/labor-requests/success?token=${token}`
      );

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 404) {
          setError('Request not found. The confirmation link may be invalid.');
        } else if (response.status === 410) {
          setError(
            'This confirmation link has expired. Confirmation links are valid for 24 hours after submission.'
          );
        } else {
          setError(errorData.error || 'Failed to load request details');
        }
        setLoading(false);
        return;
      }

      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching request details:', err);
      setError('An unexpected error occurred. Please try again later.');
      setLoading(false);
    }
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <CardTitle className="text-red-900">Unable to Load Request</CardTitle>
                <CardDescription className="text-red-700">
                  {error || 'An error occurred'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 mb-4">
              If you just submitted a request, please check your email for a confirmation link.
              If you're having trouble, please contact us at support@findconstructionstaffing.com.
            </p>
            <Button
              onClick={() => router.push('/request-labor')}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Submit New Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50 mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <div>
              <CardTitle className="text-green-900 text-2xl">
                Request Submitted Successfully!
              </CardTitle>
              <CardDescription className="text-green-700 text-base">
                Your labor request has been sent to matched agencies
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Request Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Request Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Project Name</p>
            <p className="font-semibold text-gray-900">{data.request.projectName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Company</p>
            <p className="font-semibold text-gray-900">{data.request.companyName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact Email</p>
            <p className="font-semibold text-gray-900">{data.request.contactEmail}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact Phone</p>
            <p className="font-semibold text-gray-900">{data.request.contactPhone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Submitted</p>
            <p className="font-semibold text-gray-900">
              {formatDate(data.request.submittedAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Craft Requirements</p>
            <p className="font-semibold text-gray-900">
              {data.request.craftCount} {data.request.craftCount === 1 ? 'craft' : 'crafts'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Matched Agencies */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Matched Agencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.matches.total > 0 ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-3xl font-bold text-blue-900 mb-1">
                  {data.matches.total}
                </p>
                <p className="text-sm text-blue-700">
                  {data.matches.total === 1 ? 'agency' : 'agencies'} matched to your request
                </p>
              </div>

              {data.matches.byCraft.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Match Breakdown:</p>
                  {data.matches.byCraft.map((craft, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-gray-700">{craft.craftName}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {craft.matches} {craft.matches === 1 ? 'agency' : 'agencies'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                No agencies were matched at this time. We'll continue searching and notify you when suitable agencies are found.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            What Happens Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.matches.total > 0 ? (
            <>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Agencies Review Your Request</p>
                  <p className="text-sm text-gray-600">
                    Matched agencies will receive your labor request details and review the requirements.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">You'll Hear Back Within 24-48 Hours</p>
                  <p className="text-sm text-gray-600">
                    Interested agencies will reach out directly via email or phone to discuss your needs and provide quotes.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Choose Your Agency</p>
                  <p className="text-sm text-gray-600">
                    Compare responses and select the agency that best fits your project requirements.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              We'll notify you via email as soon as agencies are matched to your request. This typically happens within 24 hours.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => router.push('/')}
          variant="outline"
          className="flex-1"
        >
          Back to Home
        </Button>
        <Button
          onClick={() => router.push('/request-labor')}
          className="flex-1"
        >
          Submit Another Request
        </Button>
      </div>

      {/* Small Print */}
      <p className="text-xs text-gray-500 text-center mt-6">
        This confirmation page is valid until {formatDate(data.expiresAt)}.
        Please save this page or note your request ID: {data.request.id}
      </p>
    </div>
  );
}
