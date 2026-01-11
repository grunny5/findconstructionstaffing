'use client';

/**
 * ComplianceExpirationAlert Component
 * Feature: 013-industry-compliance-and-verification
 * Task: 6.1.4 - Create ComplianceExpirationAlert Component
 *
 * Displays an alert on the agency dashboard when compliance items are expiring soon.
 * Warning styling for 30-7 days, error styling for <7 days or expired.
 * Dismissible with state stored in localStorage.
 */

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import { type ComplianceItemFull, COMPLIANCE_DISPLAY_NAMES } from '@/types/api';
import Link from 'next/link';

interface ComplianceExpirationAlertProps {
  /** Array of expiring or expired compliance items */
  expiringItems: ComplianceItemFull[];
  /** Optional URL to link to compliance settings (default: /dashboard/compliance) */
  complianceUrl?: string;
  /** Optional agency ID for localStorage key (default: 'default') */
  agencyId?: string;
  /** Optional fetch error to display as a non-blocking notification */
  fetchError?: string | null;
}

/**
 * Calculate days until expiration using UTC to avoid timezone issues
 */
function daysUntilExpiration(expirationDate: string): number {
  const today = new Date();
  const todayUTC = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );

  const expDate = new Date(expirationDate);
  const expDateUTC = Date.UTC(
    expDate.getUTCFullYear(),
    expDate.getUTCMonth(),
    expDate.getUTCDate()
  );

  const diffTime = expDateUTC - todayUTC;
  const days = diffTime / (1000 * 60 * 60 * 24);
  return days < 0 ? Math.floor(days) : Math.ceil(days);
}

/**
 * Determine severity based on days remaining
 */
function getSeverity(days: number): 'expired' | 'urgent' | 'warning' | 'none' {
  if (days < 0) return 'expired';
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'warning';
  return 'none';
}

export function ComplianceExpirationAlert({
  expiringItems,
  complianceUrl = '/dashboard/compliance',
  agencyId = 'default',
  fetchError = null,
}: ComplianceExpirationAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  // Storage key for dismissed state
  const storageKey = `compliance-alert-dismissed-${agencyId}`;

  // Load dismissed state from localStorage on mount
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(storageKey);
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        // Validate the date is valid before using it
        if (!isNaN(dismissedDate.getTime())) {
          const now = new Date();
          // Reset dismissed state if it's been more than 24 hours
          if (now.getTime() - dismissedDate.getTime() > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(storageKey);
            setIsDismissed(false);
          } else {
            setIsDismissed(true);
          }
        } else {
          // Invalid date stored, remove it and treat as not dismissed
          localStorage.removeItem(storageKey);
          setIsDismissed(false);
        }
      }
    } catch (error) {
      // localStorage not available (private mode, etc.) - treat as not dismissed
      console.warn('localStorage access failed:', error);
      setIsDismissed(false);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(storageKey, new Date().toISOString());
    } catch (error) {
      // localStorage not available (private mode, quota errors, etc.)
      console.warn('Failed to persist dismiss state:', error);
    }
    // Always update state even if storage fails
    setIsDismissed(true);
  };

  type Severity = 'expired' | 'urgent' | 'warning' | 'none';
  interface EnrichedItem {
    item: ComplianceItemFull;
    days: number;
    severity: Severity;
  }

  const enrichedItems: EnrichedItem[] = expiringItems
    .filter(
      (item): item is ComplianceItemFull & { expirationDate: string } =>
        item.expirationDate !== null
    )
    .map((item) => {
      const days = daysUntilExpiration(item.expirationDate);
      return { item, days, severity: getSeverity(days) };
    })
    .filter((enriched) => enriched.severity !== 'none');

  // Render fetch error alert if there was an error loading compliance data
  const errorAlert =
    fetchError && !isErrorDismissed ? (
      <Alert
        variant="default"
        className="relative border-yellow-500 bg-yellow-50"
      >
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="pr-8 text-yellow-800">
          Unable to Load Compliance Data
        </AlertTitle>
        <AlertDescription className="text-yellow-700">
          <p className="text-sm">
            Could not load compliance expiration data for agency {agencyId}.
            Your compliance settings may still be accessible.
          </p>
          <div className="mt-2">
            <Button asChild size="sm" variant="outline">
              <Link href={complianceUrl}>View Compliance Settings</Link>
            </Button>
          </div>
        </AlertDescription>
        <button
          onClick={() => setIsErrorDismissed(true)}
          className="absolute top-4 right-4 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    ) : null;

  // Don't render expiration alert if no relevant items or dismissed
  if (enrichedItems.length === 0 || isDismissed) {
    return errorAlert;
  }

  // Categorize items by severity
  const expiredItems = enrichedItems.filter((e) => e.severity === 'expired');
  const urgentItems = enrichedItems.filter((e) => e.severity === 'urgent');
  const warningItems = enrichedItems.filter((e) => e.severity === 'warning');

  // Determine overall severity (show most severe)
  const hasExpired = expiredItems.length > 0;
  const hasUrgent = urgentItems.length > 0;
  const variant = hasExpired || hasUrgent ? 'destructive' : 'default';
  const Icon = hasExpired || hasUrgent ? AlertCircle : AlertTriangle;

  return (
    <div className="space-y-4">
      {errorAlert}
      <Alert variant={variant} className="relative">
        <Icon className="h-4 w-4" />
        <AlertTitle className="pr-8">
          {hasExpired
            ? 'Compliance Certifications Expired'
            : hasUrgent
              ? 'Urgent: Compliance Certifications Expiring Soon'
              : 'Compliance Certifications Expiring in 30 Days'}
        </AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            {expiredItems.length > 0 && (
              <div>
                <p className="font-semibold text-sm">
                  Expired ({expiredItems.length}):
                </p>
                <ul className="list-disc list-inside text-sm ml-4">
                  {expiredItems.map(({ item, days }) => (
                    <li key={item.id}>
                      {COMPLIANCE_DISPLAY_NAMES[item.type]} - expired{' '}
                      {Math.abs(days)} {Math.abs(days) === 1 ? 'day' : 'days'}{' '}
                      ago
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {urgentItems.length > 0 && (
              <div>
                <p className="font-semibold text-sm">
                  Expiring within 7 days ({urgentItems.length}):
                </p>
                <ul className="list-disc list-inside text-sm ml-4">
                  {urgentItems.map(({ item, days }) => (
                    <li key={item.id}>
                      {COMPLIANCE_DISPLAY_NAMES[item.type]} - expires in {days}{' '}
                      {days === 1 ? 'day' : 'days'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {warningItems.length > 0 && (
              <div>
                <p className="font-semibold text-sm">
                  Expiring within 30 days ({warningItems.length}):
                </p>
                <ul className="list-disc list-inside text-sm ml-4">
                  {warningItems.map(({ item, days }) => (
                    <li key={item.id}>
                      {COMPLIANCE_DISPLAY_NAMES[item.type]} - expires in {days}{' '}
                      {days === 1 ? 'day' : 'days'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4">
              <Button
                asChild
                size="sm"
                variant={hasExpired || hasUrgent ? 'default' : 'outline'}
              >
                <Link href={complianceUrl}>Update Now</Link>
              </Button>
            </div>
          </div>
        </AlertDescription>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    </div>
  );
}
