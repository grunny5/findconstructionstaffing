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
import { AlertCircle } from 'lucide-react';

export interface UserDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    full_name?: string | null;
  };
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for deleting a user account.
 *
 * @param isOpen - Whether the dialog is visible.
 * @param onOpenChange - Called when dialog open state changes.
 * @param user - User data to display in the dialog.
 * @param onConfirm - Called when the user confirms the deletion.
 * @param isLoading - When true, disables buttons and shows loading state.
 * @returns The alert dialog element to render.
 */
export function UserDeleteDialog({
  isOpen,
  onOpenChange,
  user,
  onConfirm,
  isLoading = false,
}: UserDeleteDialogProps) {
  const displayName = user.full_name || user.email;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                You are about to permanently delete the account for{' '}
                <strong>{displayName}</strong>
                {user.full_name && (
                  <>
                    {' '}
                    (<span className="text-muted-foreground">{user.email}</span>
                    )
                  </>
                )}
                .
              </p>
              <p className="text-red-600 font-medium">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            data-testid="confirm-delete-button"
          >
            {isLoading ? 'Deleting...' : 'Delete User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
