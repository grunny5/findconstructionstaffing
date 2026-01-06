'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UserFormModal } from './UserFormModal';

export interface AdminUsersActionsProps {
  onRefresh?: () => void;
}

export function AdminUsersActions({ onRefresh }: AdminUsersActionsProps) {
  const router = useRouter();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const handleCreateUserSuccess = () => {
    // If onRefresh is provided, use it. Otherwise refresh the page
    if (onRefresh) {
      onRefresh();
    } else {
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => setIsCreateUserOpen(true)}
          data-testid="create-user-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <UserFormModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onSuccess={handleCreateUserSuccess}
      />
    </>
  );
}
