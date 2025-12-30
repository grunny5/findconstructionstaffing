'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AgencyStatusDialog } from '@/components/admin/AgencyStatusDialog';
import { useToast } from '@/hooks/use-toast';
import { Power, PowerOff } from 'lucide-react';

interface AgencyStatusToggleProps {
  agencyId: string;
  agencyName: string;
  currentStatus: 'active' | 'inactive';
}

/**
 * Client component for toggling agency active status.
 * Displays a button that opens a confirmation dialog before changing status.
 * Refreshes the page and shows a toast notification after successful update.
 *
 * @param agencyId - The ID of the agency to toggle
 * @param agencyName - The name of the agency (for display in dialog)
 * @param currentStatus - Current status ('active' or 'inactive')
 */
export function AgencyStatusToggle({
  agencyId,
  agencyName,
  currentStatus,
}: AgencyStatusToggleProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      const newStatus = currentStatus === 'active' ? false : true;

      const response = await fetch(`/api/admin/agencies/${agencyId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || 'Failed to update agency status'
        );
      }

      const data = await response.json();

      // Close dialog
      setIsDialogOpen(false);

      // Show success toast
      toast({
        title: 'Success',
        description: data.message || 'Agency status updated successfully',
      });

      // Refresh the page data
      router.refresh();
    } catch (error) {
      // Show error toast
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  const isDeactivating = currentStatus === 'active';

  return (
    <>
      <Button
        variant={isDeactivating ? 'destructive' : 'default'}
        onClick={() => setIsDialogOpen(true)}
      >
        {isDeactivating ? (
          <>
            <PowerOff className="mr-2 h-4 w-4" />
            Deactivate
          </>
        ) : (
          <>
            <Power className="mr-2 h-4 w-4" />
            Reactivate
          </>
        )}
      </Button>

      <AgencyStatusDialog
        isOpen={isDialogOpen}
        agencyName={agencyName}
        currentStatus={currentStatus}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </>
  );
}
