'use client';

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ClaimVerificationChecklistProps {
  emailDomainVerified: boolean;
  phoneProvided: boolean;
  positionProvided: boolean;
  verificationMethod: 'email' | 'phone' | 'manual';
}

interface ChecklistItemProps {
  label: string;
  passed: boolean;
  description?: string;
}

function ChecklistItem({ label, passed, description }: ChecklistItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-white">
      <div className="flex-shrink-0 mt-0.5">
        {passed ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
      </div>
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            passed ? 'text-green-900' : 'text-red-900'
          }`}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs text-gray-600 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        <span
          className={`text-xs font-semibold ${
            passed ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {passed ? 'PASS' : 'FAIL'}
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
}: ClaimVerificationChecklistProps) {
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
          label="Email Domain Match"
          passed={emailDomainVerified}
          description={
            emailDomainVerified
              ? 'Business email domain matches agency website'
              : 'Business email domain does not match agency website'
          }
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
