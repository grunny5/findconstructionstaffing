'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { ClaimStatus } from '@/types/database';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Claim request with agency data from GET /api/claims/my-requests
 */
interface ClaimRequest {
  id: string;
  agency_id: string;
  user_id: string;
  status: ClaimStatus;
  business_email: string;
  phone_number: string;
  position_title: string;
  verification_method: 'email' | 'phone' | 'manual';
  email_domain_verified: boolean;
  additional_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  agency: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
}

/**
 * API response structure
 */
interface ClaimRequestsResponse {
  data: ClaimRequest[];
}

/**
 * Get badge variant based on claim status
 */
function getStatusBadgeVariant(
  status: ClaimStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending':
      return 'outline'; // Yellow
    case 'under_review':
      return 'secondary'; // Blue
    case 'approved':
      return 'default'; // Green
    case 'rejected':
      return 'destructive'; // Red
    default:
      return 'outline';
  }
}

/**
 * Get status display text
 */
function getStatusText(status: ClaimStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'under_review':
      return 'Under Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * ClaimStatusList component
 * Displays user's claim requests with status, agency info, and actions
 */
export function ClaimStatusList() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClaims() {
      if (!user) {
        setClaims([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/claims/my-requests');

        if (!response.ok) {
          throw new Error('Failed to fetch claim requests');
        }

        const data: ClaimRequestsResponse = await response.json();
        setClaims(data.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchClaims();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Unable to load claim requests</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (claims.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Claim Requests</CardTitle>
          <CardDescription>
            Track the status of your agency claim requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-4">No claim requests yet</p>
            <p className="text-xs text-gray-500 mb-6">
              Find an agency and submit a claim request to get started
            </p>
            <Link href="/">
              <Button variant="outline" size="sm">
                Browse Agencies
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim Requests</CardTitle>
        <CardDescription>
          Track the status of your agency claim requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {claims.map((claim) => (
          <div
            key={claim.id}
            className="border rounded-lg p-4 space-y-3"
            role="article"
            aria-label={`Claim request for ${claim.agency.name}`}
          >
            {/* Agency Info */}
            <div className="flex items-start gap-3">
              {claim.agency.logo_url ? (
                <Image
                  src={claim.agency.logo_url}
                  alt={`${claim.agency.name} logo`}
                  width={48}
                  height={48}
                  className="rounded-md object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-gray-500 text-xs font-medium">
                    {claim.agency.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-gray-900">
                  {claim.agency.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getStatusBadgeVariant(claim.status)}>
                    {getStatusText(claim.status)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Claim Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Submitted:</span>
                <p className="text-gray-900 font-medium">
                  {formatDate(claim.created_at)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Claim ID:</span>
                <p className="text-gray-900 font-mono text-xs">
                  {claim.id.slice(0, 8)}...
                </p>
              </div>
            </div>

            {/* Rejection Reason (if rejected) */}
            {claim.status === 'rejected' && claim.rejection_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-900 mb-1">
                  Rejection Reason
                </p>
                <p className="text-sm text-red-800">{claim.rejection_reason}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {claim.status === 'rejected' && (
                <Link
                  href={`/claim/${claim.agency.slug}`}
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Resubmit
                  </Button>
                </Link>
              )}
              {claim.status === 'approved' && (
                <Link
                  href={`/dashboard/agency/${claim.agency.slug}`}
                  className="inline-flex"
                >
                  <Button size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Agency
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
