'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, AlertCircle } from 'lucide-react';

interface ClaimRejectionDialogProps {
  isOpen: boolean;
  agencyName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const MIN_REASON_LENGTH = 20;

export function ClaimRejectionDialog({
  isOpen,
  agencyName,
  onConfirm,
  onCancel,
  isLoading = false,
}: ClaimRejectionDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const characterCount = reason.trim().length;
  const isValid = characterCount >= MIN_REASON_LENGTH;
  const remaining = MIN_REASON_LENGTH - characterCount;

  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmedReason = reason.trim();

    if (trimmedReason.length < MIN_REASON_LENGTH) {
      setError(
        `Rejection reason must be at least ${MIN_REASON_LENGTH} characters (currently ${trimmedReason.length} characters)`
      );
      return;
    }

    setError('');
    onConfirm(trimmedReason);
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value);
    if (error) {
      setError('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle>Reject Claim for {agencyName}</DialogTitle>
          </div>
          <DialogDescription>
            Please provide a detailed reason for rejecting this claim request.
            The requester will receive this reason via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              Rejection Reason <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this claim is being rejected. Be specific and professional."
              value={reason}
              onChange={handleReasonChange}
              rows={6}
              disabled={isLoading}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-sm">
              <span
                className={
                  isValid
                    ? 'text-green-600 font-medium'
                    : remaining <= 5
                      ? 'text-amber-600 font-medium'
                      : 'text-gray-500'
                }
              >
                {characterCount} / {MIN_REASON_LENGTH} characters
                {!isValid && ` (${remaining} more required)`}
              </span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Important:</strong> The rejection reason should be
              professional and constructive. It will help the requester
              understand why their claim was denied and what steps they can take
              to resubmit if appropriate.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || !isValid}
          >
            {isLoading ? 'Rejecting...' : 'Reject Claim'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
