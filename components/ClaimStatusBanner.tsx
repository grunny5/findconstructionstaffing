'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { ClaimStatus } from '@/types/database';

/**
 * Claim request with minimal data needed for banner
 */
interface ClaimRequest {
  id: string;
  status: ClaimStatus;
  agency: {
    name: string;
    slug: string;
  };
}

/**
 * API response structure
 */
interface ClaimRequestsResponse {
  data: ClaimRequest[];
}

/**
 * Local storage key prefix for dismissed banners
 */
const DISMISSED_BANNER_KEY_PREFIX = 'claim-banner-dismissed-';

/**
 * Get localStorage key for a specific claim
 */
function getDismissedKey(claimId: string): string {
  return `${DISMISSED_BANNER_KEY_PREFIX}${claimId}`;
}

/**
 * Check if banner was dismissed for a specific claim
 */
function isBannerDismissed(claimId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(getDismissedKey(claimId)) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark banner as dismissed for a specific claim
 */
function dismissBanner(claimId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getDismissedKey(claimId), 'true');
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * ClaimStatusBanner component
 * Displays notification banner for pending or approved claims on homepage
 */
export function ClaimStatusBanner() {
  const { user } = useAuth();
  const [claim, setClaim] = useState<ClaimRequest | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClaims() {
      if (!user) {
        setLoading(false);
        setClaim(null);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch('/api/claims/my-requests');

        if (!response.ok) {
          throw new Error('Failed to fetch claim requests');
        }

        const data: ClaimRequestsResponse = await response.json();

        // Find first pending or approved claim (prioritize approved)
        const approvedClaim = data.data.find((c) => c.status === 'approved');
        const pendingClaim = data.data.find((c) => c.status === 'pending');

        const claimToShow = approvedClaim || pendingClaim || null;

        if (claimToShow && !isBannerDismissed(claimToShow.id)) {
          setClaim(claimToShow);
          setIsDismissed(false);
        } else {
          setClaim(null);
        }
      } catch (error) {
        // Silently fail - banner is not critical
        console.error('Error fetching claims for banner:', error);
        setClaim(null);
      } finally {
        setLoading(false);
      }
    }

    fetchClaims();
  }, [user]);

  const handleDismiss = () => {
    if (claim) {
      dismissBanner(claim.id);
      setIsDismissed(true);
      setClaim(null);
    }
  };

  // Don't render during loading or if no claim to show
  if (loading || !claim || isDismissed) {
    return null;
  }

  const isPending = claim.status === 'pending';
  const isApproved = claim.status === 'approved';

  return (
    <Alert
      className={
        isApproved
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
          : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
      }
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {isPending && (
        <Clock className="h-4 w-4 text-yellow-800 dark:text-yellow-100" />
      )}
      {isApproved && (
        <CheckCircle2 className="h-4 w-4 text-green-800 dark:text-green-100" />
      )}

      <div className="flex items-start justify-between gap-4">
        <AlertDescription
          className={
            isApproved
              ? 'text-green-900 dark:text-green-100'
              : 'text-yellow-900 dark:text-yellow-100'
          }
        >
          {isPending && (
            <>
              Claim request pending review for{' '}
              <strong>{claim.agency.name}</strong>.{' '}
              <Link
                href="/settings"
                className="underline font-medium hover:no-underline"
              >
                View Status
              </Link>
            </>
          )}
          {isApproved && (
            <>
              Your claim for <strong>{claim.agency.name}</strong> was approved!{' '}
              <Link
                href={`/dashboard/agency/${claim.agency.slug}`}
                className="underline font-medium hover:no-underline"
              >
                Manage your profile
              </Link>
            </>
          )}
        </AlertDescription>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className={
            isApproved
              ? 'text-green-800 hover:text-green-900 hover:bg-green-100 dark:text-green-100 dark:hover:text-green-50 dark:hover:bg-green-900 -mr-2 -mt-1'
              : 'text-yellow-800 hover:text-yellow-900 hover:bg-yellow-100 dark:text-yellow-100 dark:hover:text-yellow-50 dark:hover:bg-yellow-900 -mr-2 -mt-1'
          }
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
