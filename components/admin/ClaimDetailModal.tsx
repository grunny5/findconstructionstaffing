'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';
import type { ClaimStatus } from '@/types/database';
import type { ClaimRequest } from '@/types/api';
import { ClaimVerificationChecklist } from './ClaimVerificationChecklist';
import { ClaimApprovalConfirmation } from './ClaimApprovalConfirmation';
import { ClaimRejectionDialog } from './ClaimRejectionDialog';

interface ClaimDetailModalProps {
  isOpen: boolean;
  claim: ClaimRequest | null;
  onClose: () => void;
  onRefresh?: () => void;
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

/**
 * Displays a modal with detailed information about a claim request and actions to approve or reject it.
 *
 * Renders a read-only review UI for the provided `claim`, shows confirmation dialogs for approve/reject flows,
 * performs optional server requests when confirming actions, and triggers callback props as appropriate.
 *
 * @param isOpen - Controls whether the modal is visible.
 * @param claim - The claim data to display; if `null` the component renders nothing.
 * @param onClose - Called when the modal should be closed.
 * @param onRefresh - Optional callback invoked after a successful approve or reject to refresh parent data.
 * @param onApprove - Optional callback invoked with the claim id when the Approve action is triggered; if omitted the component runs its internal approval flow.
 * @param onReject - Optional callback invoked with the claim id when the Reject action is triggered; if omitted the component runs its internal rejection flow.
 * @returns The claim detail modal UI when `claim` is provided, or `null` when `claim` is `null`.
 */
export function ClaimDetailModal({
  isOpen,
  claim,
  onClose,
  onRefresh,
  onApprove,
  onReject,
}: ClaimDetailModalProps) {
  const [showApprovalConfirmation, setShowApprovalConfirmation] =
    useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!claim) return null;

  const handleApproveClick = () => {
    if (onApprove) {
      onApprove(claim.id);
    } else {
      setShowApprovalConfirmation(true);
    }
  };

  const handleRejectClick = () => {
    if (onReject) {
      onReject(claim.id);
    } else {
      setShowRejectionDialog(true);
    }
  };

  const handleConfirmApproval = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/claims/${claim.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to approve claim');
      }

      toast.success('Claim Approved', {
        description: `${claim.agency.name} claim has been approved. User role updated to agency_owner.`,
      });

      setShowApprovalConfirmation(false);
      onClose();

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast.error('Approval Failed', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRejection = async (reason: string) => {
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/claims/${claim.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to reject claim');
      }

      toast.success('Claim Rejected', {
        description: `${claim.agency.name} claim has been rejected. Requester will be notified.`,
      });

      setShowRejectionDialog(false);
      onClose();

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast.error('Rejection Failed', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(claim.agency.name)}`;

  return (
    <>
      <ClaimApprovalConfirmation
        isOpen={showApprovalConfirmation}
        agencyName={claim.agency.name}
        onConfirm={handleConfirmApproval}
        onCancel={() => setShowApprovalConfirmation(false)}
        isLoading={isProcessing}
      />

      <ClaimRejectionDialog
        isOpen={showRejectionDialog}
        agencyName={claim.agency.name}
        onConfirm={handleConfirmRejection}
        onCancel={() => setShowRejectionDialog(false)}
        isLoading={isProcessing}
      />

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
              Review the claim request details and verification information
              below.
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
                  onClick={handleRejectClick}
                  disabled={isProcessing}
                >
                  Reject
                </Button>
                <Button onClick={handleApproveClick} disabled={isProcessing}>
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
