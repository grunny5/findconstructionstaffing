'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AgencyFormModal } from '@/components/admin/AgencyFormModal';
import { Edit } from 'lucide-react';
import type { AdminAgency } from '@/types/admin';

interface AgencyEditButtonProps {
  agency: AdminAgency;
}

/**
 * Client component that renders an Edit button and manages the AgencyFormModal.
 * Opens the modal in edit mode when clicked, and refreshes the page after successful update.
 *
 * @param agency - The agency data to edit
 */
export function AgencyEditButton({ agency }: AgencyEditButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit Agency
      </Button>

      <AgencyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        agency={agency}
      />
    </>
  );
}
