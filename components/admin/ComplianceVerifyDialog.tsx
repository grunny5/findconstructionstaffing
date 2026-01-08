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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileText,
  Calendar,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ComplianceItemFull } from '@/types/api';
import { COMPLIANCE_DISPLAY_NAMES, COMPLIANCE_DESCRIPTIONS } from '@/types/api';

interface ComplianceVerifyDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Compliance item to review */
  complianceItem: ComplianceItemFull | null;
  /** Agency ID */
  agencyId: string;
  /** Agency name for display */
  agencyName: string;
  /** Callback when verification is complete */
  onComplete: () => void;
  /** Callback to close the dialog */
  onClose: () => void;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const isImageFile = (url: string | null): boolean => {
  if (!url) return false;
  // Strip query parameters for signed URLs before checking extension
  const urlWithoutQuery = url.split('?')[0];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  return imageExtensions.some((ext) =>
    urlWithoutQuery.toLowerCase().endsWith(ext)
  );
};

/**
 * Dialog for admin to review and verify/reject compliance documents
 *
 * Displays the compliance document, details, and allows admin to:
 * - Verify the document
 * - Reject with a reason
 * - Add admin notes
 *
 * @param isOpen - Controls whether the dialog is visible
 * @param complianceItem - The compliance item to review
 * @param agencyId - The agency ID
 * @param agencyName - The agency name for display
 * @param onComplete - Called when verification is complete
 * @param onClose - Called when the dialog should be closed
 */
export function ComplianceVerifyDialog({
  isOpen,
  complianceItem,
  agencyId,
  agencyName,
  onComplete,
  onClose,
}: ComplianceVerifyDialogProps) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!complianceItem) return null;

  const handleReset = () => {
    setShowRejectReason(false);
    setRejectReason('');
    setAdminNotes('');
    setIsProcessing(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleVerify = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch(
        `/api/admin/agencies/${agencyId}/compliance/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            complianceType: complianceItem.type,
            action: 'verify',
            notes: adminNotes.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to verify compliance document'
        );
      }

      toast.success('Document Verified', {
        description: `${COMPLIANCE_DISPLAY_NAMES[complianceItem.type]} for ${agencyName} has been verified.`,
      });

      handleReset();
      onComplete();
      onClose();
    } catch (error) {
      toast.error('Verification Failed', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Rejection Reason Required', {
        description: 'Please provide a reason for rejecting this document.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(
        `/api/admin/agencies/${agencyId}/compliance/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            complianceType: complianceItem.type,
            action: 'reject',
            reason: rejectReason.trim(),
            notes: adminNotes.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || 'Failed to reject compliance document'
        );
      }

      toast.success('Document Rejected', {
        description: `${COMPLIANCE_DISPLAY_NAMES[complianceItem.type]} for ${agencyName} has been rejected. Agency will be notified.`,
      });

      handleReset();
      onComplete();
      onClose();
    } catch (error) {
      toast.error('Rejection Failed', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectReason(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Compliance Document Review</span>
            {complianceItem.isVerified ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline">
                <AlertCircle className="h-3 w-3 mr-1" />
                Pending Verification
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Review the compliance document and verification details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Compliance Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Compliance Information
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
              <div>
                <p className="text-xs text-gray-600 font-medium">Agency</p>
                <p className="text-sm font-semibold">{agencyName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">
                  Compliance Type
                </p>
                <p className="text-sm font-semibold">
                  {COMPLIANCE_DISPLAY_NAMES[complianceItem.type]}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {COMPLIANCE_DESCRIPTIONS[complianceItem.type]}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Expiration:</span>
                <span
                  className={
                    complianceItem.isExpired ? 'text-red-600 font-medium' : ''
                  }
                >
                  {formatDate(complianceItem.expirationDate)}
                  {complianceItem.isExpired && ' (Expired)'}
                </span>
              </div>
            </div>
          </div>

          {/* Document Preview */}
          {complianceItem.documentUrl && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Document Preview
              </h3>
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                {isImageFile(complianceItem.documentUrl) ? (
                  <div className="relative w-full" style={{ minHeight: 400 }}>
                    <Image
                      src={complianceItem.documentUrl}
                      alt={`${COMPLIANCE_DISPLAY_NAMES[complianceItem.type]} document`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 672px"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-4">
                      PDF or non-image file
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={complianceItem.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Document in New Tab
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!complianceItem.documentUrl && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  No Document Uploaded
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  The agency has marked this compliance as active but has not
                  uploaded a verification document.
                </p>
              </div>
            </div>
          )}

          {/* Verification Status */}
          {complianceItem.isVerified && complianceItem.verifiedAt && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Verification Status
              </h3>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    Verified on {formatDate(complianceItem.verifiedAt)}
                  </span>
                </div>
                {complianceItem.verifiedBy && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Verified by: {complianceItem.verifiedBy}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Existing Notes */}
          {complianceItem.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Existing Admin Notes
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {complianceItem.notes}
                </p>
              </div>
            </div>
          )}

          {/* Admin Notes Input */}
          <div className="space-y-3">
            <Label htmlFor="admin-notes" className="text-sm font-semibold">
              Admin Notes (Optional)
            </Label>
            <Textarea
              id="admin-notes"
              placeholder="Add any notes about this verification..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              disabled={isProcessing}
            />
          </div>

          {/* Reject Reason Input */}
          {showRejectReason && (
            <div className="space-y-3">
              <Label
                htmlFor="reject-reason"
                className="text-sm font-semibold text-red-700"
              >
                Rejection Reason *
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="Explain why this document is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                disabled={isProcessing}
                className="border-red-200 focus:border-red-500 focus:ring-red-500"
              />
              <p className="text-xs text-gray-600">
                This reason will be sent to the agency owner.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Close
          </Button>
          {!complianceItem.isVerified && (
            <>
              {!showRejectReason ? (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleRejectClick}
                    disabled={isProcessing}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={handleVerify}
                    disabled={isProcessing || !complianceItem.documentUrl}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Verify Document
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectReason(false);
                      setRejectReason('');
                    }}
                    disabled={isProcessing}
                  >
                    Cancel Rejection
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isProcessing || !rejectReason.trim()}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Confirm Rejection
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
