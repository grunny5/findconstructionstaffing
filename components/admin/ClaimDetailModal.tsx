'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Hash,
} from 'lucide-react';
import type { ClaimStatus } from '@/types/database';
import { ClaimVerificationChecklist } from './ClaimVerificationChecklist';

// Type definitions matching the API response
interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
}

interface User {
  id: string;
  full_name: string | null;
  email: string;
}

export interface ClaimRequest {
  id: string;
  agency_id: string;
  user_id: string;
  status: ClaimStatus;
  business_email: string;
  phone_number: string | null;
  position_title: string;
  verification_method: 'email' | 'phone' | 'manual';
  email_domain_verified: boolean;
  additional_notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  agency: Agency;
  user: User;
}

interface ClaimDetailModalProps {
  isOpen: boolean;
  claim: ClaimRequest | null;
  onClose: () => void;
  onApprove?: (claimId: string) => void;
  onReject?: (claimId: string) => void;
}

// Status badge variant mapping
const statusBadgeVariant = (
  status: ClaimStatus
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'pending':
      return 'outline';
    case 'under_review':
      return 'secondary';
    case 'approved':
      return 'default';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

const statusDisplayName = (status: ClaimStatus): string => {
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
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function ClaimDetailModal({
  isOpen,
  claim,
  onClose,
  onApprove,
  onReject,
}: ClaimDetailModalProps) {
  if (!claim) return null;

  const handleApprove = () => {
    if (onApprove) {
      onApprove(claim.id);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(claim.id);
    }
  };

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(claim.agency.name)}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Claim Request Review</span>
            <Badge variant={statusBadgeVariant(claim.status)}>
              {statusDisplayName(claim.status)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Review the claim request details and verification information below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Agency Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Agency Information
            </h3>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border">
              {claim.agency.logo_url && (
                <Image
                  src={claim.agency.logo_url}
                  alt={`${claim.agency.name} logo`}
                  width={64}
                  height={64}
                  className="object-contain rounded"
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{claim.agency.name}</h4>
                {claim.agency.website && (
                  <a
                    href={claim.agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    {claim.agency.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Requester Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Requester Information
            </h3>
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    Business Email
                  </p>
                  <p className="text-sm">{claim.business_email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {claim.email_domain_verified ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">
                          Domain Verified
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-xs text-red-700 font-medium">
                          Domain Not Verified
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {claim.phone_number && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-sm">{claim.phone_number}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    Position/Title
                  </p>
                  <p className="text-sm">{claim.position_title}</p>
                </div>
              </div>

              {claim.user.full_name && (
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      User Account Name
                    </p>
                    <p className="text-sm">{claim.user.full_name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    User Account Email
                  </p>
                  <p className="text-sm">{claim.user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Verification Checklist
            </h3>
            <ClaimVerificationChecklist
              emailDomainVerified={claim.email_domain_verified}
              phoneProvided={!!claim.phone_number}
              positionProvided={!!claim.position_title}
              verificationMethod={claim.verification_method}
            />
          </div>

          {/* Additional Notes */}
          {claim.additional_notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Additional Notes
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {claim.additional_notes}
                </p>
              </div>
            </div>
          )}

          {/* Rejection Reason (if rejected) */}
          {claim.status === 'rejected' && claim.rejection_reason && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                Rejection Reason
              </h3>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800 whitespace-pre-wrap">
                  {claim.rejection_reason}
                </p>
              </div>
            </div>
          )}

          {/* External Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              External Verification Links
            </h3>
            <div className="flex flex-wrap gap-2">
              {claim.agency.website && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={claim.agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Agency Website
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <a
                  href={googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Google &quot;{claim.agency.name}&quot;
                </a>
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Submitted: {formatDate(claim.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Hash className="h-4 w-4" />
              <span>Claim ID: {claim.id}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {claim.status === 'pending' && (
            <>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!onReject}
              >
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={!onApprove}>
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
