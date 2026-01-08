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
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
}: ComplianceExpirationAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Storage key for dismissed state
  const storageKey = `compliance-alert-dismissed-${agencyId}`;

  // Load dismissed state from localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      // Reset dismissed state if it's been more than 24 hours
      if (now.getTime() - dismissedDate.getTime() > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(storageKey);
        setIsDismissed(false);
      } else {
        setIsDismissed(true);
      }
    }
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, new Date().toISOString());
    setIsDismissed(true);
  };

  // Filter out items that aren't expiring within 30 days or are already expired
  const relevantItems = expiringItems.filter((item) => {
    if (!item.expirationDate) return false;
    const days = daysUntilExpiration(item.expirationDate);
    const severity = getSeverity(days);
    return severity !== 'none';
  });

  // Don't render if no relevant items or dismissed
  if (relevantItems.length === 0 || isDismissed) {
    return null;
  }

  // Categorize items by severity
  const expiredItems = relevantItems.filter(
    (item) =>
      getSeverity(daysUntilExpiration(item.expirationDate!)) === 'expired'
  );
  const urgentItems = relevantItems.filter(
    (item) =>
      getSeverity(daysUntilExpiration(item.expirationDate!)) === 'urgent'
  );
  const warningItems = relevantItems.filter(
    (item) =>
      getSeverity(daysUntilExpiration(item.expirationDate!)) === 'warning'
  );

  // Determine overall severity (show most severe)
  const hasExpired = expiredItems.length > 0;
  const hasUrgent = urgentItems.length > 0;
  const variant = hasExpired || hasUrgent ? 'destructive' : 'warning';
  const Icon = hasExpired || hasUrgent ? AlertCircle : AlertTriangle;

  return (
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
                {expiredItems.map((item) => {
                  const days = Math.abs(
                    daysUntilExpiration(item.expirationDate!)
                  );
                  return (
                    <li key={item.id}>
                      {COMPLIANCE_DISPLAY_NAMES[item.type]} - expired {days}{' '}
                      {days === 1 ? 'day' : 'days'} ago
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {urgentItems.length > 0 && (
            <div>
              <p className="font-semibold text-sm">
                Expiring within 7 days ({urgentItems.length}):
              </p>
              <ul className="list-disc list-inside text-sm ml-4">
                {urgentItems.map((item) => {
                  const days = daysUntilExpiration(item.expirationDate!);
                  return (
                    <li key={item.id}>
                      {COMPLIANCE_DISPLAY_NAMES[item.type]} - expires in {days}{' '}
                      {days === 1 ? 'day' : 'days'}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {warningItems.length > 0 && (
            <div>
              <p className="font-semibold text-sm">
                Expiring within 30 days ({warningItems.length}):
              </p>
              <ul className="list-disc list-inside text-sm ml-4">
                {warningItems.map((item) => {
                  const days = daysUntilExpiration(item.expirationDate!);
                  return (
                    <li key={item.id}>
                      {COMPLIANCE_DISPLAY_NAMES[item.type]} - expires in {days}{' '}
                      {days === 1 ? 'day' : 'days'}
                    </li>
                  );
                })}
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
  );
}
