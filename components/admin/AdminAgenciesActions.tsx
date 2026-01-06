'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Download, Plus, Upload } from 'lucide-react';
import { BulkImportModal } from './BulkImportModal';
import { AgencyFormModal } from './AgencyFormModal';

export interface AdminAgenciesActionsProps {
  onRefresh?: () => void;
}

export function AdminAgenciesActions({ onRefresh }: AdminAgenciesActionsProps) {
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isCreateAgencyOpen, setIsCreateAgencyOpen] = useState(false);

  const handleBulkImportSuccess = () => {
    onRefresh?.();
  };

  const handleCreateAgencySuccess = () => {
    onRefresh?.();
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          asChild
          data-testid="download-template-button"
        >
          <Link href="/api/admin/agencies/template" download>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsBulkImportOpen(true)}
          data-testid="bulk-import-button"
        >
          <Upload className="h-4 w-4 mr-2" />
          Bulk Import
        </Button>
        <Button
          onClick={() => setIsCreateAgencyOpen(true)}
          data-testid="create-agency-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Agency
        </Button>
      </div>

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={handleBulkImportSuccess}
      />

      <AgencyFormModal
        isOpen={isCreateAgencyOpen}
        onClose={() => setIsCreateAgencyOpen(false)}
        onSuccess={handleCreateAgencySuccess}
      />
    </>
  );
}
