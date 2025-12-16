'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/types/database';

interface RoleChangeConfirmModalProps {
  isOpen: boolean;
  userName: string;
  oldRole: UserRole;
  newRole: UserRole;
  onConfirm: (notes?: string) => Promise<void>;
  onCancel: () => void;
}

const roleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'agency_owner':
      return 'Agency Owner';
    default:
      return 'User';
  }
};

export function RoleChangeConfirmModal({
  isOpen,
  userName,
  oldRole,
  newRole,
  onConfirm,
  onCancel,
}: RoleChangeConfirmModalProps) {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(notes || undefined);
    } finally {
      setIsLoading(false);
      setNotes('');
    }
  };

  const handleCancel = () => {
    setNotes('');
    onCancel();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change User Role</AlertDialogTitle>
          <AlertDialogDescription>
            Change {userName}&apos;s role from{' '}
            <span className="font-semibold">{roleDisplayName(oldRole)}</span> to{' '}
            <span className="font-semibold">{roleDisplayName(newRole)}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Reason for role change..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500">
            This will be recorded in the audit log.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={handleCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
