'use client';

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
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AgencyStatusDialogProps {
  isOpen: boolean;
  agencyName: string;
  currentStatus: 'active' | 'inactive';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for changing agency active status.
 *
 * @param isOpen - Whether the dialog is visible.
 * @param agencyName - Agency name shown in the dialog.
 * @param currentStatus - Current status ('active' or 'inactive') to determine action.
 * @param onConfirm - Called when the user confirms the action.
 * @param onCancel - Called when the dialog is dismissed or cancelled.
 * @param isLoading - When true, disables buttons and shows loading state.
 * @returns The alert dialog element to render.
 */
export function AgencyStatusDialog({
  isOpen,
  agencyName,
  currentStatus,
  onConfirm,
  onCancel,
  isLoading = false,
}: AgencyStatusDialogProps) {
  const isDeactivating = currentStatus === 'active';

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${
                isDeactivating ? 'bg-red-100' : 'bg-green-100'
              }`}
            >
              {isDeactivating ? (
                <AlertCircle className="h-6 w-6 text-red-600" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              )}
            </div>
            <AlertDialogTitle>
              {isDeactivating ? 'Deactivate' : 'Reactivate'} {agencyName}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {isDeactivating ? (
              <>
                <span className="block mb-2">
                  This will deactivate <strong>{agencyName}</strong>. The agency
                  will no longer appear in public listings or search results.
                </span>
                <span className="block">
                  You can reactivate the agency at any time.
                </span>
              </>
            ) : (
              <>
                This will reactivate <strong>{agencyName}</strong>. The agency
                will become visible in public listings and search results again.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={
              isDeactivating
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
                : ''
            }
          >
            {isLoading
              ? isDeactivating
                ? 'Deactivating...'
                : 'Reactivating...'
              : isDeactivating
                ? 'Deactivate Agency'
                : 'Reactivate Agency'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
