'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AgencyCard from '@/components/AgencyCard';
import type { AgencyProfileFormData } from '@/lib/validations/agency-profile';
import { Eye, Edit } from 'lucide-react';

interface ProfilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: AgencyProfileFormData & {
    slug: string;
    id: string;
    logo_url?: string;
  };
  onPublish: () => Promise<void>;
  isPublishing?: boolean;
}

export function ProfilePreviewModal({
  open,
  onOpenChange,
  previewData,
  onPublish,
  isPublishing = false,
}: ProfilePreviewModalProps) {
  const handleBackToEditing = () => {
    onOpenChange(false);
  };

  const handlePublish = async () => {
    await onPublish();
  };

  // Transform form data to AgencyCard format
  const agencyForPreview = {
    id: previewData.id,
    name: previewData.name,
    slug: previewData.slug,
    description: previewData.description,
    logo_url: previewData.logo_url,
    website: previewData.website,
    phone: previewData.phone,
    email: previewData.email,
    founded_year: previewData.founded_year
      ? parseInt(previewData.founded_year, 10)
      : undefined,
    employee_count: previewData.employee_count,
    headquarters: previewData.headquarters,
    is_claimed: true,
    offers_per_diem: false,
    is_union: false,
    verified: true,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        {/* Header with Preview Mode Badge */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <DialogTitle className="text-lg font-semibold">
                Profile Preview
              </DialogTitle>
              <Badge variant="secondary" className="ml-2">
                Preview Mode
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            This is how your profile will appear to potential clients
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Preview Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-gradient-to-br from-slate-50 to-slate-100/50">
          <div className="max-w-4xl mx-auto">
            <AgencyCard agency={agencyForPreview} />
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <DialogFooter className="px-6 py-4 border-t bg-background flex-row justify-between sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBackToEditing}
            disabled={isPublishing}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Back to Editing
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="gap-2"
          >
            {isPublishing ? (
              <>
                <div
                  className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                  data-testid="loading-spinner"
                />
                Publishing...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Publish Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
