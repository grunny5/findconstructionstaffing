'use client';

import { CheckCircle, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import {
  extractEmailDomain,
  extractWebsiteDomain,
} from '@/lib/utils/email-domain-verification';

interface ClaimVerificationChecklistProps {
  emailDomainVerified: boolean;
  phoneProvided: boolean;
  positionProvided: boolean;
  verificationMethod: 'email' | 'phone' | 'manual';
  businessEmail: string;
  agencyWebsite: string | null;
}

interface ChecklistItemProps {
  label: string;
  passed: boolean;
  description?: string;
  variant?: 'success' | 'warning' | 'error';
}

function ChecklistItem({
  label,
  passed,
  description,
  variant,
}: ChecklistItemProps) {
  // Determine styling based on variant or passed state
  const getStyles = () => {
    if (variant === 'warning') {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
        textColor: 'text-orange-900',
        badgeColor: 'text-orange-700',
        badge: 'REVIEW',
      };
    } else if (passed) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        textColor: 'text-green-900',
        badgeColor: 'text-green-700',
        badge: 'PASS',
      };
    } else {
      return {
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        textColor: 'text-red-900',
        badgeColor: 'text-red-700',
        badge: 'FAIL',
      };
    }
  };

  const styles = getStyles();

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-white">
      <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${styles.textColor}`}>{label}</p>
        {description && (
          <p className="text-xs text-gray-600 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        <span className={`text-xs font-semibold ${styles.badgeColor}`}>
          {styles.badge}
        </span>
      </div>
    </div>
  );
}

export function ClaimVerificationChecklist({
  emailDomainVerified,
  phoneProvided,
  positionProvided,
  verificationMethod,
  businessEmail,
  agencyWebsite,
}: ClaimVerificationChecklistProps) {
  // Extract domains for detailed display
  let emailDomain = '';
  let websiteDomain = '';

  try {
    emailDomain = extractEmailDomain(businessEmail);
  } catch (error) {
    emailDomain = 'invalid';
  }

  if (agencyWebsite) {
    try {
      websiteDomain = extractWebsiteDomain(agencyWebsite);
    } catch (error) {
      websiteDomain = 'invalid';
    }
  }

  // Build detailed domain verification description
  const getDomainVerificationDescription = () => {
    if (!agencyWebsite) {
      return 'No agency website available for domain verification. Manual review required.';
    }

    if (emailDomainVerified) {
      return `✓ Email domain (${emailDomain}) matches agency website (${websiteDomain})`;
    } else {
      return `Email domain (${emailDomain}) does not match website domain (${websiteDomain}). Verify ownership through other means.`;
    }
  };

  // Calculate verification score
  const checks = [emailDomainVerified, phoneProvided, positionProvided];
  const passedChecks = checks.filter(Boolean).length;
  const totalChecks = checks.length;
  const scorePercentage = Math.round((passedChecks / totalChecks) * 100);

  // Determine verification status
  const getVerificationStatus = () => {
    if (scorePercentage === 100) {
      return {
        label: 'Fully Verified',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    } else if (scorePercentage >= 66) {
      return {
        label: 'Partially Verified',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
      };
    } else {
      return {
        label: 'Needs Review',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    }
  };

  const status = getVerificationStatus();

  return (
    <div className="space-y-4">
      {/* Verification Score Summary */}
      <div
        className={`p-4 rounded-lg border ${status.bgColor} ${status.borderColor}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-5 w-5 ${status.color}`} />
            <span className={`font-semibold ${status.color}`}>
              {status.label}
            </span>
          </div>
          <div className={`text-sm font-medium ${status.color}`}>
            {passedChecks}/{totalChecks} checks passed ({scorePercentage}%)
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Verification Method:{' '}
          <span className="font-medium capitalize">{verificationMethod}</span>
        </p>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        <ChecklistItem
          label="Email Domain Verification"
          passed={emailDomainVerified}
          variant={
            !emailDomainVerified && agencyWebsite ? 'warning' : undefined
          }
          description={getDomainVerificationDescription()}
        />
        <ChecklistItem
          label="Phone Number Provided"
          passed={phoneProvided}
          description={
            phoneProvided
              ? 'Contact phone number was provided'
              : 'No phone number provided'
          }
        />
        <ChecklistItem
          label="Position/Title Provided"
          passed={positionProvided}
          description={
            positionProvided
              ? 'Professional position/title specified'
              : 'No position or title provided'
          }
        />
      </div>

      {/* Verification Guidance */}
      {scorePercentage < 100 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Recommendation:</strong> Claims with lower verification
            scores may require additional manual verification through external
            sources (agency website, LinkedIn, phone call).
          </p>
        </div>
      )}
    </div>
  );
}
