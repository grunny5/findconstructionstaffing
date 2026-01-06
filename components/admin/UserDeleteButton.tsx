'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserDeleteDialog } from './UserDeleteDialog';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface UserDeleteButtonProps {
  user: {
    id: string;
    email: string;
    full_name?: string | null;
  };
  currentUserId: string;
}

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: {
      claimed_agencies?: Array<{ id: string; name: string; slug: string }>;
    };
  };
}

/**
 * Client component that renders a Delete button and manages the UserDeleteDialog.
 * Hidden when viewing the current user's own profile (cannot delete self).
 * Opens confirmation dialog when clicked, calls DELETE API on confirm.
 *
 * @param user - The user data to delete
 * @param currentUserId - The current authenticated user's ID
 */
export function UserDeleteButton({
  user,
  currentUserId,
}: UserDeleteButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Don't render delete button for own profile
  if (user.id === currentUserId) {
    return null;
  }

  const handleConfirmDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'User deleted',
          description: `${user.full_name || user.email} has been deleted successfully.`,
        });
        setIsDialogOpen(false);
        router.push('/admin/users');
      } else {
        const data: ApiErrorResponse = await response.json();

        // Handle specific error cases
        if (response.status === 409 && data.error.details?.claimed_agencies) {
          const agencyNames = data.error.details.claimed_agencies
            .map((a) => a.name)
            .join(', ');
          toast({
            variant: 'destructive',
            title: 'Cannot delete user',
            description: `User owns claimed agencies: ${agencyNames}. Unclaim these agencies first.`,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: data.error.message || 'Failed to delete user',
          });
        }
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setIsDialogOpen(true)}
        data-testid="delete-user-button"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>

      <UserDeleteDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={user}
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
      />
    </>
  );
}
