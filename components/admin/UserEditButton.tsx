'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserFormModal } from '@/components/admin/UserFormModal';
import { Pencil } from 'lucide-react';
import type { UserRole } from '@/types/database';

export interface UserEditButtonProps {
  user: {
    id: string;
    email: string;
    full_name?: string | null;
    role: UserRole;
  };
}

/**
 * Client component that renders an Edit button and manages the UserFormModal.
 * Opens the modal in edit mode when clicked, and refreshes the page after successful update.
 *
 * @param user - The user data to edit
 */
export function UserEditButton({ user }: UserEditButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        data-testid="edit-user-button"
      >
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        user={user}
      />
    </>
  );
}
